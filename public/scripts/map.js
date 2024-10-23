let map;
let markers = [];
let infoWindows = [];

// 受け取ったgeocodeを使ってマップを初期化し、マーカーを立てる
function initMap(geocodes) {
  // 中心となる最初のgeocodeを基にマップを初期化
  const initialLatLng = geocodes.length > 0 ? geocodeToLatLng(geocodes[0].geocode) : { lat: 35.682839, lng: 139.759455 };

  map = new google.maps.Map(document.getElementById('map'), {
    center: initialLatLng,
    zoom: 14,
  });

  // 各geocodeをマーカーとしてマップに追加
  geocodes.forEach((library, index) => {
    const latLng = geocodeToLatLng(library.geocode);
    addMarker(latLng, library.formal, library.address, index);
  });
}

// geocode "132.713482,34.402965" を {lat: 34.402965, lng: 132.713482} に変換
function geocodeToLatLng(geocode) {
  const [lng, lat] = geocode.split(',').map(Number);
  return { lat, lng };
}

// マーカーを追加し、クリック時に情報ウィンドウを表示
function addMarker(latLng, name, address, index) {
  const marker = new google.maps.Marker({
    position: latLng,
    map: map,
    title: name,
    icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // マーカーアイコンの色を変更
  });
  markers.push(marker);

  const infoWindow = new google.maps.InfoWindow({
    content: `<strong>${name}</strong><br>${address}`,
  });
  infoWindows.push(infoWindow);

  marker.addListener('click', () => {
    infoWindows[index].open(map, marker);
  });
}

// サーバーから図書館データを取得してマップを更新
function fetchLibraryDataAndShowMap(isbn) {
  fetch(`/searchLibrary?isbn=${isbn}`)  // 図書館データを取得するAPI
    .then(response => response.json())
    .then(libraryData => {
      const geocodes = libraryData.map(library => ({
        geocode: library.geocode,
        formal: library.formal,
        address: library.address,
      }));
      initMap(geocodes);  // 取得したgeocodeでマップを初期化
    })
    .catch(error => {
      console.error('図書館データの取得に失敗しました:', error);
    });
}

// Turbolinksのロード後にマップを表示
document.addEventListener('turbolinks:load', function() {
  const isbn = '1234567890'; // 例: ISBNを動的に取得する場合に変更
  fetchLibraryDataAndShowMap(isbn);
});
