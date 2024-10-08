require('dotenv').config();

const express = require('express');
const path = require('path');
const { fetch } = require('undici');

const app = express();

const API_KEY = process.env.API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ビューエンジンをejsにセットする
app.set('view engine', 'ejs');

// 静的ファイルの配信
app.use(express.static('public'));

// ルートページ
app.get('/', (req, res) => {
  res.render('pages/index');
});


// 本の詳細ページルート
app.get('/book/:id', (req, res) => {
  const bookId = req.params.id;
  // ここでAPIを使って本の詳細情報を取得することができます。
  res.render('pages/bookdetails', { bookId }); // bookdetails.ejs への変更
});


app.get('/searchLibrary', async (req, res) => {
  const { geocode } = req.query;

  if (!geocode) {
    return res.status(400).send('緯度と経度を指定してください');
  }

  const [longitude, latitude] = geocode.split(',');
  if (!longitude || !latitude) {
    return res.status(400).send('緯度と経度が不正です');
  }

  const url = `https://api.calil.jp/library?appkey=${API_KEY}&geocode=${encodeURIComponent(longitude)},${encodeURIComponent(latitude)}&format=json&callback=&limit=10`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
    }
    const text = await response.text(); // テキストとしてレスポンスを取得
    const data = JSON.parse(text); // JSONとしてレスポンスを解析
    res.json(data); // クライアントにデータを返す
  } catch (error) {
    console.error('APIリクエストエラー:', error);
    res.status(500).send('図書館データの取得に失敗しました');
  }
});


// 書籍検索API
app.get('/searchBook', async (req, res) => {
  const { isbn, systemid } = req.query;

  if (!isbn || !systemid) {
      return res.status(400).send('ISBNと図書館のsystemidを指定してください');
  }

  // callback=noを追加してJSON形式で応答を取得
  const checkUrl = `https://api.calil.jp/check?appkey=${API_KEY}&isbn=${encodeURIComponent(isbn)}&systemid=${encodeURIComponent(systemid)}&format=json&callback=no`;

  try {
      const response = await fetch(checkUrl);
      if (!response.ok) {
          throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
      }
      const data = await response.json();

      // デバック
      console.log('Received Book Data:', JSON.stringify(data, null, 2));

      res.json(data);
  } catch (error) {
      console.error('APIリクエストエラー:', error);
      res.status(500).send('蔵書データの取得に失敗しました');
  }
});


// 経度緯度取得api
app.get('/geocode', async (req, res) => {
  const keyword = req.query.keyword;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(keyword)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      res.json({ geocode: `${location.lng},${location.lat}` });
    } else {
      res.status(404).json({ error: 'Geocoding failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// サーバーを起動
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});