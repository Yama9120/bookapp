// デバウンス関数の定義
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 検索クエリが3文字以上の場合に楽天APIを呼び出すデバウンスされた関数
const debouncedSearch = debounce(function(query) {
    if (query.length > 2) {
        searchBooks(query);
    }
}, 300);

// ドキュメントが準備できたら
$(document).ready(function() {
    $('#search-button').on('click', function() {
        const query = $('#search-input').val();
        if (query.length > 2) {
            searchBooks(query);
        } else {
            $('#results').html('<p>検索キーワードは3文字以上で入力してください。</p>');
        }
    });
});

// 楽天APIを呼び出す関数
function searchBooks(query) {
    $('#results').html('<p>検索中...</p>');

    $.ajax({
        url: `/searchBooks?query=${encodeURIComponent(query)}`, // サーバーのエンドポイントを使用
        method: 'GET',
        success: function(data) {
            const booksWithISBN = data.Items.filter(book => book.Item.isbn); // ISBNが存在するもののみフィルタリング
            displayResults(booksWithISBN.slice(0, 10)); // 最大10件まで表示
        },
        error: function(jqXHR, errorThrown) {
            console.error('Error fetching books:', errorThrown);
            if (jqXHR.status === 429) {
                $('#results').html('<p>リクエストが多すぎます。しばらく待ってから再試行してください。</p>');
            } else {
                $('#results').html('<p>書籍の取得中にエラーが発生しました。</p>');
            }
        }
    });
}

// 検索結果を表示する関数
function displayResults(books) {
    const resultsDiv = $('#results');
    resultsDiv.empty();

    if (books && books.length > 0) {
        books.forEach(function(book) {
            const Item = book.Item; // 楽天APIのレスポンス構造に合わせて修正
            const title = Item.title || 'タイトル不明';
            const creator = Item.author || '著者不明';
            const publisher = Item.publisherName || '出版社不明';
            const thumbnailUrl = Item.largeImageUrl || ''; // 大きな画像URLを取得

            const bookHtml = `
                <div class="book-item">
                    <h2 class="book-title">${title}</h2>
                    <p class="book-creator">著者: ${creator}</p>
                    <p class="book-publisher">出版社: ${publisher}</p>
                    ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="表紙画像" class="book-thumbnail">` : ''}
                </div>
            `;
            resultsDiv.append(bookHtml);
        });
    } else {
        resultsDiv.html('<p>検索結果が見つかりませんでした。</p>');
    }
}



// function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// }

// const debouncedSearch = debounce(function(query) {
//     if (query.length > 2) {
//         searchBooks(query); // searchBooksを呼び出す
//     }
// }, 300);

// $(document).ready(function() {
//     $('#search-input').on('input', function() {
//         const query = $(this).val();
//         debouncedSearch(query); // 入力時にdebouncedSearchを呼び出す
//     });

//     $('#search-form').submit(function(e) {
//         e.preventDefault();
//         const query = $('#search-input').val();
//         if (query.length > 2) {
//             searchBooks(query); // フォーム送信時にもsearchBooksを呼び出す
//         }
//     });
// });

// function searchBooks(keyword) {
//     const encodedKeyword = encodeURIComponent(keyword);
//     const apiUrl = `https://ndlsearch.ndl.go.jp/api/opensearch?any=${encodedKeyword}`;

//     fetch(apiUrl)
//         .then(response => response.text())
//         .then(data => {
//             // XMLをDOMにパース
//             const parser = new DOMParser();
//             const xmlDoc = parser.parseFromString(data, "text/xml");
//             const items = xmlDoc.getElementsByTagName("item");

//             const books = Array.from(items).map(item => {
//                 const title = item.getElementsByTagName("dc:title")[0]?.textContent || '不明';
//                 const creator = item.getElementsByTagName("dc:creator")[0]?.textContent || '不明';
//                 const publisher = item.getElementsByTagName("dc:publisher")[0]?.textContent || '不明';
//                 let jpECode = '';
//                 let isbn = '';

//                 // JP-e コードとISBNを取得
//                 const identifierElements = item.getElementsByTagName("dc:identifier");
//                 for (let i = 0; i < identifierElements.length; i++) {
//                     const identifierType = identifierElements[i].getAttribute("xsi:type");
//                     if (identifierType === "dcndl:ISBN") {
//                         isbn = identifierElements[i].textContent.replace(/-/g, ''); // ISBNからハイフンを削除
//                     } else if (identifierType === "dcndl:JP-e") { // JP-e コードを優先して取得
//                         jpECode = identifierElements[i].textContent;
//                     }
//                 }

//                 return {
//                     title,
//                     creator,
//                     publisher,
//                     isbn,
//                     jpECode // JP-e コードも返す
//                 };
//             });

//             displayResults(books); // 検索結果を表示
//         })
//         .catch(error => console.error('Error fetching data:', error));
// }

// function displayResults(books) {
//     const resultsDiv = $('#results');
//     resultsDiv.empty();

//     if (books && books.length > 0) {
//         books.forEach(book => {
//             const thumbnailUrl = book.isbn 
//                 ? `https://ndlsearch.ndl.go.jp/thumbnail/${book.isbn}.jpg`
//                 : ''; // ISBNがある場合はサムネイルURLを作成

//             const bookHtml = `
//                 <div class="book-item">
//                     <h2 class="book-title">${book.title}</h2>
//                     <p class="book-creator">著者: ${book.creator}</p>
//                     <p class="book-publisher">出版社: ${book.publisher}</p>
//                     ${thumbnailUrl ? `<img src="${thumbnailUrl}" alt="表紙画像" class="book-thumbnail">` : ''}
//                 </div>
//             `;
//             resultsDiv.append(bookHtml);
//         });
//     } else {
//         resultsDiv.html('<p>検索結果が見つかりませんでした。</p>');
//     }
// }
