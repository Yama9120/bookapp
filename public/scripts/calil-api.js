// Calil APIキーを設定
const API_KEY = '9e1e59710bd49874aad19bd9f4b00b41'; // 実際のAPIキーに置き換えてください

$(document).ready(function() {
    // 都道府県リストを表示
    var prefectureList = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", /* 他の都道府県も追加 */ "沖縄県"];
    var cityList = {};  // 市町村リストを格納する

    // 都道府県リストの初期化
    $.each(prefectureList, function(index, value) {
        $('#prefecture').append('<option value="'+value+'">'+value+'</option>');
    });

    // 都道府県が選択されたら市町村を表示する (Calil APIを利用して市町村データを取得)
    $('#prefecture').on('change', function() {
        var selectedPrefecture = $(this).val();
        
        // Calil APIのダイアログを呼び出す
        var city_selector = new CalilCitySelectDlg({
            'appkey': API_KEY, 
            'select_func': function(systemid_list, pref_name) {
                console.log(systemid_list, pref_name); // 市町村選択結果を確認
                $('#city').empty();
                $.each(systemid_list, function(index, systemid) {
                    $('#city').append('<option value="'+systemid+'">'+systemid+'</option>');
                });
            }
        });
        city_selector.showDlg();
    });

    // 検索フォーム送信時の処理
    $('#bookSearchForm').on('submit', function(event) {
        event.preventDefault();

        var bookName = $('#bookName').val().trim();
        var systemid = $('#city').val();

        if (bookName && systemid) {
            // ISBN取得 (仮に特定のISBNを設定)
            var isbnList = ["9784103534227"];  // 例: 村上春樹の1Q84 ISBN

            // 蔵書検索を実行
            searchBooks(isbnList, systemid);
        } else {
            alert('本の名前と市町村を選択してください。');
        }
    });
});

// 図書の検索を行う
function searchBooks(isbnList, systemid) {
  const calil = new Calil({
    appkey: API_KEY,
    render: new CalilRender(),
    isbn: isbnList,    // ISBNリストを検索
    systemid: [systemid]  // 選択された市町村のシステムID
  });
  
  calil.search();
}