// デバウンス関数の実装
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 検索関数をデバウンスで包む
const debouncedSearch = debounce(function(query) {
    if (query.length > 2) { // 最小3文字以上で検索
        searchBooks(query);
    }
}, 300); // 300ミリ秒のデバウンス時間

// 入力フィールドのイベントリスナーを設定
$(document).ready(function() {
    $('#search-input').on('input', function() {
        const query = $(this).val();
        debouncedSearch(query);
    });

    $('#search-form').submit(function(e) {
        e.preventDefault();
        const query = $('#search-input').val();
        if (query.length > 2) {
            searchBooks(query);
        }
    });
});

function searchBooks(query) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
    
    $('#results').html('<p>検索中...</p>');

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            displayResults(data.items);
            console.log(data.items);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error('Error fetching books:', errorThrown);
            if (jqXHR.status === 429) {
                $('#results').html('<p>リクエストが多すぎます。しばらく待ってから再試行してください。</p>');
            } else {
                $('#results').html('<p>エラーが発生しました。もう一度お試しください。</p>');
            }
        }
    });
}

function displayResults(books) {
    const resultsDiv = $('#results');
    resultsDiv.empty();  // 「検索中...」のメッセージをクリア

    if (books && books.length > 0) {
        books.forEach(function(book) {
            const volumeInfo = book.volumeInfo;
            const title = volumeInfo.title;
            const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : '著者不明';
            const thumbnail = volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : '';

            // 書籍のデータをURLエンコードして保存
            const bookData = encodeURIComponent(JSON.stringify({ id: book.id, title, authors, thumbnail }));

            // 詳細ページへのリンク追加
            const bookHtml = `
                <div class="book-item">
                    <a href="/book/${book.id}">
                        ${thumbnail ? `<img src="${thumbnail}" alt="${title}の表紙">` : ''}
                        <h2>${title}</h2>
                        <p>著者: ${authors}</p>
                    </a>
                </div>
            `;

            resultsDiv.append(bookHtml);
        });
    } else {
        resultsDiv.html('<p>検索結果が見つかりませんでした。</p>');
    }
}

function saveBookData(bookData) {
    // データをlocalStorageに保存
    localStorage.setItem('selectedBook', bookData);
    
    // 保存されたデータをコンソールに表示して確認
    console.log("保存されたデータ:", localStorage.getItem('selectedBook'));
    
    // データ保存後に手動で詳細ページに遷移
    window.location.href = `/book?id=${JSON.parse(decodeURIComponent(bookData)).id}`;
}
