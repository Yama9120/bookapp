document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('geocode-form');
    const keywordInput = document.getElementById('keyword-input');
    const resultDiv = document.getElementById('geocode-result');

    const path = window.location.pathname;
    const isbn = path.split('/').pop();  // URLの最後の部分からISBNを取得

    if (form) {
        // フォーム入力での検索
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const keyword = keywordInput.value;

            if (keyword) {
                getGeocode(keyword)
                    .then(displayResult)
                    .then(geocode => searchLibraryAndBooks(geocode, isbn))
                    .catch(displayError);
            } else {
                displayError('キーワードを入力してください。');
            }
        });

        // 位置情報での検索
        const locationButton = document.getElementById('location-button');
        locationButton.addEventListener('click', function() {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        const geocode = `${position.coords.longitude},${position.coords.latitude}`;
                        
                        displayResult(geocode);
                        searchLibraryAndBooks(geocode, isbn)
                            .catch(displayError);
                    },
                    function(error) {
                        handleGeolocationError(error);
                    }
                );
            } else {
                displayError('お使いのブラウザは位置情報に対応していません。');
            }
        });
    }

    function getGeocode(keyword) {
        return fetch(`/geocode?keyword=${encodeURIComponent(keyword)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('ネットワークレスポンスが正常ではありません');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                return data.geocode; // geocodeを返す
            });
    }

    function displayResult(geocode) {
        console.log('取得したgeocode:', geocode);
        return geocode;
    }

    function searchLibraryAndBooks(geocode, isbn) {
        const encodedGeocode = encodeURIComponent(geocode);
        return fetch(`/searchLibrary?geocode=${encodedGeocode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('図書館データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                console.log('取得した図書館データ:', data);
                return searchLibrariesSequentially(data, isbn); // 順に検索
            })
            .catch(error => {
                displayError('図書館データの取得に失敗しました');
            });
    }

    async function searchLibrariesSequentially(libraries, isbn) {
        resultDiv.innerHTML = ''; // 結果をクリア
        const libraryResultDiv = document.createElement('div');
        resultDiv.appendChild(libraryResultDiv);
    
        for (let library of libraries) {
            const libraryDiv = document.createElement('div');
            libraryDiv.className = 'library-block';
            libraryDiv.innerHTML = `
                <p>${library.formal}　${parseFloat(library.distance).toFixed(1)}km先</p>
                <p>蔵書検索中...</p>  <!-- 蔵書検索結果の場所を確保 -->
            `;
            libraryResultDiv.appendChild(libraryDiv);
    
            try {
                await searchBookInLibrary(library.systemid, library.libkey, isbn, libraryDiv);
            } catch (error) {
                console.error('Book search failed:', error);
                libraryDiv.innerHTML += '<p class="error">蔵書検索に失敗しました。もう一度検索を押してください。</p>';
            }
        }
    }

    async function searchBookInLibrary(systemid, libkey, isbn, libraryDiv) {
        const response = await fetch(`/searchBook?systemid=${systemid}&isbn=${isbn}`);
        if (!response.ok) {
            throw new Error('蔵書検索に失敗しました');
        }
    
        const data = await response.json();
        console.log('蔵書検索結果:', data); // デバッグ用のログ出力
    
        // エラーチェック
        if (data.error) {
            console.error('エラー:', data.error);
            return; // エラーがあれば処理を終了
        }
    
        const session = data.session;
        if (session) {
            await pollForBookStatus(session, libraryDiv, libkey); // ポーリング処理
        } else {
            // data.booksがundefinedまたは空の配列かをチェック
            if (Array.isArray(data.books) && data.books.length > 0) {
                console.log('初回結果:', data.books); // 初回結果を確認
                updateBookStatus(data.books, libraryDiv, libkey); // 初回結果表示
            } else {
                console.warn('蔵書が見つかりませんでした。再検索します。');
                // 一定時間待ってから再検索
                setTimeout(() => {
                    console.log('再検索を開始します...');
                    searchBookInLibrary(systemid, libkey, isbn, libraryDiv); // 再検索
                }, 500); // 500ミリ秒（0.5秒）待機
            }
        }
    }

    // ポーリング処理
    function pollForBookStatus(session, libraryDiv, libkey) {
        setTimeout(() => {
            fetch(`/checkBookStatus?session=${session}&format=json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('蔵書情報の取得に失敗しました');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('ポーリング結果:', data);  // ポーリング結果を確認
                    if (data.continue === 1) {
                        updateBookStatus(data.books, libraryDiv, libkey);
                        pollForBookStatus(session, libraryDiv, libkey);  // 2秒以上の間隔でポーリング
                    } else {
                        updateBookStatus(data.books, libraryDiv, libkey);  // 最終結果を表示
                    }
                })
                .catch(error => {
                    console.error('Polling failed:', error);
                    libraryDiv.innerHTML += '<p class="error">蔵書情報の取得に失敗しました</p>';
                });
        }, 2000);  // 2秒間隔を開けてポーリング
    }
    

    // 蔵書ステータスの更新
    function updateBookStatus(books, libraryDiv, targetLibkey) {
        libraryDiv.querySelector('p:last-child').remove();  // "蔵書検索中..." を削除

        // booksがnullまたはundefinedの場合にエラーメッセージを表示
        if (!books || Object.keys(books).length === 0) {
            libraryDiv.innerHTML += `<p class="error">蔵書データがありません</p>`;
            return;
        }

        Object.entries(books).forEach(([isbn, libraryData]) => {
            Object.entries(libraryData).forEach(([systemid, data]) => {
                const libStatus = data.libkey || {};  // libkey を取得
                const reserveUrl = data.reserveurl;  // 予約URLを取得
                
                // 図書館のlibkeyをフィルタリング
                if (libStatus[targetLibkey]) {  // targetLibkeyで一致する図書館があるか確認
                    const status = libStatus[targetLibkey];  // 図書館名ではなくtargetLibkeyに一致する蔵書情報を取得

                    // 貸出状況に応じたアイコンとメッセージの表示
                    let statusMessage = '';
                    let statusIcon = '';

                    if (status === '貸出可') {
                        statusMessage = '貸出可';
                        statusIcon = '✔️';
                        libraryDiv.innerHTML += `
                            <div class="library-status available">
                                <p>${statusMessage} ${statusIcon}</p>
                                ${reserveUrl ? `<p><a href="${reserveUrl}" target="_blank">予約</a></p>` : ''}
                            </div>`;
                    } else if (status === '貸出中') {
                        statusMessage = '貸出中';
                        statusIcon = '⏳';
                        libraryDiv.innerHTML += `
                            <div class="library-status unavailable">
                                <p>${statusMessage} ${statusIcon}</p>
                                ${reserveUrl ? `<p><a href="${reserveUrl}" target="_blank">予約</a></p>` : ''}
                            </div>`;
                    } else {
                        statusMessage = '蔵書なし';
                        statusIcon = '❌';
                        libraryDiv.innerHTML += `
                            <div class="library-status none">
                                <p>${statusMessage} ${statusIcon}</p>
                            </div>`;
                    }

                    // 予約リンクがある場合に表示
                    // if (reserveUrl && status !== '蔵書なし') {
                    //     libraryDiv.innerHTML += `<p><a href="${reserveUrl}" target="_blank">予約</a></p>`;
                    // }
                } else {
                    // 蔵書なしの場合
                    libraryDiv.innerHTML += `
                        <div class="library-status none">    
                            <p>蔵書なし ❌</p>
                        </div>`;
                }
            });
        });
    }

    function displayError(message) {
        resultDiv.innerHTML = `<p class="error">${message}</p>`;
    }

    function handleGeolocationError(error) {
        console.error('Geolocation error:', error);
        displayError('位置情報の取得に失敗しました。');
    }
});
