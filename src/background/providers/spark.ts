import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'
import CryptoJS from 'crypto-js';
// import WebSocket from 'ws';
require('ws')

export class SparkProvider implements Provider {
  modelResullt: string
  constructor(private appId: string, private apiSecret: string, private apiKey: string) {
    this.appId = appId
    this.apiSecret = apiSecret
    this.apiKey = apiKey
    this.modelResullt = ''
  }

  async getWebsocketUrl() {
    const apiKey = this.apiKey;
    const apiSecret = this.apiSecret;
    const url = 'wss://spark-api.xf-yun.com/v3.5/chat';
    const host = location.host;
    const date = new Date().toUTCString();
    const algorithm = 'hmac-sha256';
    const headers = 'host date request-line';
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v3.5/chat HTTP/1.1`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    return `${url}?authorization=${authorization}&date=${date}&host=${host}`;
  }

  webSocketSend(prompt: string, ttsWS: WebSocket) {
    var params = {
        "header": {
            "app_id": this.appId,
            "uid": "fd3f47e4-d"
        },
        "parameter": {
            "chat": {
                "domain": "generalv3.5",
                "temperature": 0.5,
                "max_tokens": 1024
            }
        },
        "payload": {
            "message": {
                "text": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
        }
    }
    console.log(JSON.stringify(params))
    ttsWS.send(JSON.stringify(params))
  }

  async generateAnswer(params: GenerateAnswerParams) {
    this.modelResullt = ''
    this.getWebsocketUrl().then(url => {
      let ttsWS: WebSocket
      // if (typeof window.WebSocket === "undefined") {
      //   alert('浏览器不支持WebSocket');
      //   return;
      // } else {
        ttsWS = new WebSocket(url);
      // }
      
     
      ttsWS.onopen = e => {
          this.webSocketSend(params.prompt, ttsWS);
      };
      ttsWS.onmessage = e => {
          this.result(e.data, params, ttsWS);
      };
      ttsWS.onerror = e => {
          // clearTimeout(this.playTimeout)
          alert('WebSocket报错，请f12查看详情');
          console.error(`详情查看：${encodeURI(url.replace('wss:', 'https:'))}`);
      };
      ttsWS.onclose = e => {
          console.log(e);
      };
    });
    return {}
  }


  result(message: string, params: GenerateAnswerParams, ttsWS: WebSocket): void {
    const jsonData = JSON.parse(message);
    if (jsonData.header.code !== 0) {
        alert(`提问失败: ${jsonData.header.code}:${jsonData.header.message}`);
        console.error(`${jsonData.header.code}:${jsonData.header.message}`);
        return;
    }
    if (jsonData.header.code === 0 && jsonData.header.status === 2) {
        ttsWS.close();
    }
    
    console.debug('sse message', message)
    if (message === '[DONE]') {
      params.onEvent({ type: 'done' })
      return
    }
    let data
    try {
      data = JSON.parse(message)
      const text = data.payload.choices.text[0].content
      if (text === '<|im_end|>' || text === '<|im_sep|>') {
        return
      }
      this.modelResullt += text
      params.onEvent({
        type: 'answer',
        data: {
          text: this.modelResullt,
          messageId: data.id,
          conversationId: data.id,
        },
      })
    } catch (err) {
      console.error(err)
      return
    }
  }
}
