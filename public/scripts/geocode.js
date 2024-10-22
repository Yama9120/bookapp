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
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                displayError('位置情報の使用が許可されていません。');
                                break;
                            case error.POSITION_UNAVAILABLE:
                                displayError('位置情報を取得できませんでした。');
                                break;
                            case error.TIMEOUT:
                                displayError('位置情報の取得がタイムアウトしました。');
                                break;
                            default:
                                displayError('位置情報の取得中にエラーが発生しました。');
                                break;
                        }
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
                console.log('APIからのレスポンス:', data);
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
                console.log('Library Search Results:', data);
                displayLibraryResults(data, isbn);
            })
            .catch(error => {
                console.error('Library search failed:', error);
                displayError('図書館データの取得に失敗しました');
            });
    }

    function displayLibraryResults(libraries, isbn) {
        resultDiv.innerHTML = '';  // 結果をクリア
        const libraryResultDiv = document.createElement('div');
        libraryResultDiv.innerHTML = `<h3>近くの図書館</h3>`;

        libraries.forEach(library => {
            const libraryDiv = document.createElement('div');
            libraryDiv.innerHTML = `
                <p>${library.formal}</p>
                <p>蔵書検索中...</p>  <!-- 蔵書検索結果の場所を確保 -->
            `;
            libraryResultDiv.appendChild(libraryDiv);

            // 各図書館での蔵書検索を行う
            searchBookInLibrary(library.systemid, isbn, libraryDiv);
        });

        resultDiv.appendChild(libraryResultDiv);
    }

    function searchBookInLibrary(systemid, isbn, libraryDiv) {
        fetch(`/searchBook?systemid=${systemid}&isbn=${isbn}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('蔵書検索に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                const session = data.session;  // セッションIDを取得
                if (session) {
                    // ポーリングを開始
                    pollForBookStatus(session, libraryDiv);
                } else {
                    updateBookStatus(data.books, libraryDiv);  // 初回結果表示
                }
            })
            .catch(error => {
                console.error('Book search failed:', error);
                libraryDiv.innerHTML += '<p class="error">もう一度検索を押してください</p>';
            });
    }    

    // ポーリング処理
    function pollForBookStatus(session, libraryDiv) {
        setTimeout(() => {
            fetch(`/checkBookStatus?session=${session}&format=json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('蔵書情報の取得に失敗しました');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Polling result:', data);
                    // ポーリングを続けるか確認
                    if (data.continue === 1) {
                        // 現在の結果を表示してポーリングを継続
                        updateBookStatus(data.books, libraryDiv);
                        pollForBookStatus(session, libraryDiv);  // 2秒以上の間隔でポーリング
                    } else {
                        // 最終結果を表示
                        updateBookStatus(data.books, libraryDiv);
                    }
                })
                .catch(error => {
                    console.error('Polling failed:', error);
                    libraryDiv.innerHTML += '<p class="error">蔵書情報の取得に失敗しました</p>';
                });
        }, 2000);  // 2秒間隔を開けてポーリング
    }

    // 蔵書ステータスの更新
    function updateBookStatus(books, libraryDiv) {
        libraryDiv.querySelector('p:last-child').remove();  // "蔵書検索中..." を削除

        Object.entries(books).forEach(([isbn, libraryData]) => {
            // 各 systemid に基づいて図書館データを取得
            Object.entries(libraryData).forEach(([systemid, data]) => {
                const libStatus = data.libkey || {};  // libkey を取得
                const reserveUrl = data.reserveurl;  // 予約URLを取得

                // 図書館の蔵書状況を表示
                if (Object.keys(libStatus).length > 0) {  // libStatus が空でないか確認
                    for (const [libraryName, status] of Object.entries(libStatus)) {
                        const bookStatus = `${libraryName}: ${status}`;
                        libraryDiv.innerHTML += `<p>${bookStatus}</p>`;
                    }
                } else {
                    // libkey が空の場合のメッセージ
                    libraryDiv.innerHTML += `<p>蔵書なし</p>`;
                    console.warn(`ISBN ${isbn} の図書館の状態が取得できませんでした`);  // 警告出力
                }

                // 予約リンクがある場合に表示
                if (reserveUrl) {
                    libraryDiv.innerHTML += `<p><a href="${reserveUrl}" target="_blank">予約</a></p>`;
                }
            });
        });
    }

    function displayError(message) {
        resultDiv.innerHTML = `<p class="error">${message}</p>`;
    }
});
