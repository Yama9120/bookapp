$(document).ready(function() {
    $('#search-form').submit(function(e) {
        e.preventDefault();
        const query = $('#search-input').val();
        searchBooks(query);
    });
});

function searchBooks(query) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;

    $.ajax({
        url: apiUrl,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            displayResults(data.items);
            console.log(data.items); // APIリクエスト確認
        },
        error: function(error) {
            console.error('Error fetching books:', error);
            $('#results').html('<p>エラーが発生しました。もう一度お試しください。</p>');
        }
    });
}

function displayResults(books) {
    const resultsDiv = $('#results');
    resultsDiv.empty();

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
