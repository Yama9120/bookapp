require('dotenv').config();

const express = require('express');
const path = require('path');
const { fetch } = require('undici');
const axios = require('axios');
// const { XMLParser } = require('fast-xml-parser');

const app = express();

const API_KEY = process.env.API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID;

// 環境変数に基づいて baseUrl を設定する
const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction ? '/bookapp/' : '/';

// ビューエンジンをejsにセットする
app.set('view engine', 'ejs');

// 静的ファイルの配信
app.use(express.static('public'));

// ルートページ
app.get('/', (req, res) => {
  res.render('pages/index', { baseUrl });
});


// 本の詳細ページルート
app.get('/bookdetails/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  const rakutenApiUrl = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&isbn=${isbn}&applicationId=${process.env.RAKUTEN_APP_ID}`;

  try {
    // 楽天ブックスAPIからデータを取得
    const response = await axios.get(rakutenApiUrl);
    const bookData = response.data.Items[0].Item;

    // itemCodeとその他のデータをEJSテンプレートに渡す
    res.render('pages/bookdetails', {
      itemCode: bookData.itemCode,
      bookTitle: bookData.title,
      author: bookData.author,
      publisherName: bookData.publisherName,
      largeImageUrl: bookData.largeImageUrl,
      itemCaption: bookData.itemCaption
    });
  } catch (error) {
    console.error('Error fetching data from Rakuten API:', error);
    res.status(500).send('Error fetching book details from Rakuten API');
  }
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

  // 初回リクエスト
  const checkUrl = `https://api.calil.jp/check?appkey=${API_KEY}&isbn=${encodeURIComponent(isbn)}&systemid=${encodeURIComponent(systemid)}&format=json&callback=no`;

  try {
      const response = await fetch(checkUrl);
      if (!response.ok) {
          throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
      }
      const data = await response.json();

      // デバック
      console.log('Received Book Data:', JSON.stringify(data, null, 2));

      // 継続が必要な場合はポーリングを実施
      if (data.continue === 1) {
          // ポーリング処理
          const session = data.session;
          const pollResult = await pollCalilAPI(session);
          return res.json(pollResult);
      }

      res.json(data);
  } catch (error) {
      console.error('APIリクエストエラー:', error);
      res.status(500).send('蔵書データの取得に失敗しました');
  }
});

// 書籍状態確認API
app.get('/checkBookStatus', async (req, res) => {
  const { session } = req.query;

  if (!session) {
      return res.status(400).send('セッションIDを指定してください');
  }

  const checkUrl = `https://api.calil.jp/check?appkey=${API_KEY}&session=${session}&format=json&callback=no`;

  try {
      const response = await fetch(checkUrl);
      if (!response.ok) {
          throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
      }
      const data = await response.json();
      console.log('Checked Book Status Data:', JSON.stringify(data, null, 2));
      res.json(data);
  } catch (error) {
      console.error('APIリクエストエラー:', error);
      res.status(500).send('蔵書状態の取得に失敗しました');
  }
});

// 経度緯度取得api
app.get('/geocode', async (req, res) => {
  const { keyword } = req.query;
  console.log('Received keyword:', keyword); // 追加: キーワードを確認
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(keyword)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Google Maps API response:', data);
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

// booksearch api
// app.get('/searchNDL', async (req, res) => {
//   const { query } = req.query;

//   if (!query) {
//       return res.status(400).send('検索キーワードを入力してください');
//   }

//   const encodedKeyword = encodeURIComponent(query);
//   const apiUrl = `https://ndlsearch.ndl.go.jp/api/opensearch?any=${encodedKeyword}`;

//   console.log(`Request URL: ${apiUrl}`); // ログにリクエストURLを表示

//   try {
//       const response = await fetch(apiUrl);
//       const xmlText = await response.text();
  
//       const parser = new XMLParser({
//           ignoreAttributes: false,
//           attributeNamePrefix: "@_",
//           ignoreNameSpace: true
//       });
//       const jsonData = parser.parse(xmlText);

//       // レスポンスからrecordsを取得
//       const records = jsonData?.searchRetrieveResponse?.records?.record || [];
//       const books = Array.isArray(records) ? records : [records];

//       // DOMParserを使用してrecordDataをパースする
//       const jsdom = require("jsdom");
//       const { JSDOM } = jsdom;

//       const formattedBooks = books.map(book => {
//         const recordDataXml = book?.recordData;
    
//         // DOMParserを使ってrecordDataをパース
//         const dom = new JSDOM(recordDataXml);
//         const document = dom.window.document;

//         const title = document.querySelector("dc\\:title")?.textContent || '不明';
//         const creator = document.querySelector("dc\\:creator")?.textContent || '不明';
//         const publisher = document.querySelector("dc\\:publisher")?.textContent || '不明';
    
//         const subjects = [...document.querySelectorAll("dc\\:subject")].map(el => el.textContent) || [];
//         const descriptions = [...document.querySelectorAll("dc\\:description")].map(el => el.textContent) || [];
//         const language = document.querySelector("dc\\:language")?.textContent || '不明';
    
//         // ISBNを含むdc:identifierを取得するロジック
//         const identifierElements = [...document.querySelectorAll("dc\\:identifier")];
//         let isbn = null;
//         identifierElements.forEach(el => {
//             const identifierText = el.textContent;
//             if (identifierText.startsWith('978')) { // ISBN-13形式であるかどうかを確認
//                 isbn = identifierText.replace(/-/g, ''); // ハイフンを削除
//             }
//         });

//         // ISBNの値をコンソールにログ出力
//         console.log(`タイトル: ${title}, ISBN: ${isbn}`);

//         return {
//             title,
//             creator,
//             publisher,
//             subject: subjects,
//             description: descriptions,
//             language,
//             isbn // ISBNを追加して返す
//         };
//     });

//         // クライアント側に書籍情報を返す
//         res.json(formattedBooks);
//     } catch (error) {
//         console.error('APIリクエストエラー:', error);
//         res.status(500).send('書籍データの取得に失敗しました');
//     }
// });


// 楽天API用のエンドポイントを追加
app.get('/searchBooks', async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 3) {
      return res.status(400).send('検索キーワードは3文字以上で入力してください');
  }

  const apiUrl = `https://app.rakuten.co.jp/services/api/BooksTotal/Search/20170404?format=json&keyword=${encodeURIComponent(query)}&applicationId=${RAKUTEN_APP_ID}&hits=30`;

  try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
          throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
  } catch (error) {
      console.error('APIリクエストエラー:', error);
      res.status(500).send('書籍データの取得に失敗しました');
  }
});

// サーバーを起動
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});