const express = require('express');
const path = require('path');

const app = express();

const API_KEY = '9e1e59710bd49874aad19bd9f4b00b41'; // 実際のAPIキーを入力

// ビューエンジンをejsにセットする
app.set('view engine', 'ejs');

// 静的ファイルの配信
app.use(express.static('public'));

// ルートページ
app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/searchLibrary', async (req, res) => {
  const { pref, city } = req.query;

  if (!pref || !city) {
      return res.status(400).send('都道府県と市区町村を指定してください');
  }

  // JSON形式でレスポンスを取得するためにcallbackパラメータに空白を指定
  const url = `https://api.calil.jp/library?appkey=${API_KEY}&pref=${encodeURIComponent(pref)}&city=${encodeURIComponent(city)}&format=json&callback=`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
    }
    const text = await response.text(); // テキストとしてレスポンスを取得
    console.log('Response Text:', text); // レスポンスのテキストを確認
    try {
      // JSON形式でない場合に備え、XMLなども対応する場合は別の解析処理を追加する
      const data = JSON.parse(text); // JSONとしてレスポンスを解析
      console.log('Library Data:', data);
      res.json(data); // クライアントにデータを送信
    } catch (error) {
      console.error('レスポンスの解析に失敗しました:', error);
      res.status(500).send('レスポンスの解析に失敗しました');
    }
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    res.status(500).send('図書館データの取得に失敗しました: HTTPエラー!');
  }
});



// 書籍検索API
app.get('/searchBook', async (req, res) => {
  const { isbn, systemid } = req.query;
  const apiKey = '9e1e59710bd49874aad19bd9f4b00b41';

  try {
      const response = await axios.get('https://api.calil.jp/check', {
          params: {
              appkey: apiKey,
              isbn: isbn,
              systemid: systemid,
              format: 'json'
          }
      });
      res.json(response.data);
  } catch (error) {
      res.status(500).json({ error: '書籍情報の取得に失敗しました' });
  }
});


// サーバーを起動
const PORT = 8082;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});