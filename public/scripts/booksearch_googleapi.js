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

const debouncedSearch = debounce(function(query) {
    if (query.length > 2) {
        searchBooks(query);
    }
}, 300);

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
    $('#results').html('<p>検索中...</p>');

    $.ajax({
        url: `/searchBooks?query=${encodeURIComponent(query)}`, // サーバーのエンドポイントを使用
        method: 'GET',
        success: function(data) {
            displayResults(data.Items); // 楽天APIのレスポンス構造に合わせて修正
            console.log(data.Items);
        },
        error: function(jqXHR, errorThrown) {
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
    resultsDiv.empty();

    if (books && books.length > 0) {
        books.forEach(function(book) {
            const Item = book.Item; // 楽天APIのレスポンス構造に合わせて修正
            const bookHtml = `
                <div class="book-item">
                    <a href="/book/${Item.isbn}">
                        ${Item.largeImageUrl ? `<img src="${Item.largeImageUrl}" alt="${Item.title}の表紙">` : ''}
                        <h2>${Item.title}</h2>
                        <p>著者: ${Item.author}</p>
                    </a>
                </div>
            `;
            resultsDiv.append(bookHtml);
        });
    } else {
        resultsDiv.html('<p>検索結果が見つかりませんでした。</p>');
    }
}
