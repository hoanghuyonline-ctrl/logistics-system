/**
 * Bắc Trung Hải Logistics - Zalo API Webhook Gateway
 * Provides direct message delivery and reconnect call-to-action triggers.
 */

const axios = require("axios");

async function sendZaloReconnectNotification(userCid, recipientPhone, zaloAccessToken) {
  if (!userCid || !recipientPhone) {
    throw new Error("Missing recipient coordinates or Client ID");
  }

  const endpoint = "https://openapi.zalo.me/v3.0/oa/message/transaction";
  const payload = {
    recipient: {
      phone: recipientPhone
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "transaction",
          language: "VI",
          elements: [
            {
              title: "Bắc Trung Hải Logistics - Cập nhật Tỷ Giá",
              subtitle: "Yêu cầu kết nối lại hệ thống Bắc Trung Hải để cập nhật dải giá tỷ giá 3980",
              image_url: "https://bactrunghai.vn/assets/zalo-branding.png"
            }
          ],
          buttons: [
            {
              title: "Kết Nối Lại Ngay",
              type: "oa.open.url",
              url: `https://bactrunghai.vn/source-search?cid=${encodeURIComponent(userCid)}`
            }
          ]
        }
      }
    }
  };

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        "Content-Type": "application/json",
        "access_token": zaloAccessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error("Zalo API Connection Failure:", error.message);
    throw error;
  }
}

module.exports = {
  sendZaloReconnectNotification
};
