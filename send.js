const FormData = require('form-data');

module.exports = async (req, res) => {
    // BOT_TOKEN đã được cập nhật trực tiếp
    const token = process.env.BOT_TOKEN || '8921957218:AAFCEqYBED26CTyp3vFxKpfU3m4dsFduBiI';
    if (!token) return res.status(500).json({ error: "Thiếu BOT_TOKEN" });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, media, text, chat_id } = req.body;

        // --- 1. GỬI TIN NHẮN CHỈ CÓ TEXT ---
        if (type === 'text') {
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' })
            });
            const data = await r.json();
            return res.status(200).json(data);
        }

        // --- 2. GỬI 1 TẤM ẢNH (SEND PHOTO) ---
        if (type === 'photo' && media && media.length === 1) {
            const formData = new FormData();
            formData.append('chat_id', chat_id);
            
            const b64 = media[0].media.split(',')[1];
            const buf = Buffer.from(b64, 'base64');
            
            formData.append('photo', buf, {
                filename: 'photo.jpg',
                contentType: 'image/jpeg'
            });
            if (media[0].caption) {
                formData.append('caption', media[0].caption);
            }

            const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
                method: 'POST',
                body: formData.getBuffer(),
                headers: formData.getHeaders()
            });

            const data = await r.json();
            return res.status(200).json(data);
        }

        // --- 3. GỬI TỪ 2 ẢNH TRỞ LÊN (SEND MEDIA GROUP) ---
        if (type === 'media' && Array.isArray(media) && media.length > 1) {
            const formData = new FormData();
            formData.append('chat_id', chat_id);

            const telegramMedia = media.map((item, index) => {
                const fieldName = `file${index}`;
                const b64 = item.media.split(',')[1]; 
                const buf = Buffer.from(b64, 'base64');
                
                formData.append(fieldName, buf, {
                    filename: `image${index}.jpg`,
                    contentType: 'image/jpeg'
                });

                return {
                    type: 'photo',
                    media: `attach://${fieldName}`,
                    caption: item.caption || ''
                };
            });

            formData.append('media', JSON.stringify(telegramMedia));

            const r = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                method: 'POST',
                body: formData.getBuffer(),
                headers: formData.getHeaders()
            });
            
            const data = await r.json();
            return res.status(200).json(data);
        }

        return res.status(400).json({ error: "Định dạng dữ liệu không hợp lệ" });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
