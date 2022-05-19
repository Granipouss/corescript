import { Bitmap } from '../rpg_core/Bitmap';
import { AudioManager } from '../rpg_managers/AudioManager';

export const Decrypter = new (class Decrypter {
    hasEncryptedImages = false;
    hasEncryptedAudio = false;
    _requestImgFile = [];
    _headerlength = 16;
    _xhrOk = 400;
    _encryptionKey = '';
    _ignoreList = ['img/system/Window.png'];
    SIGNATURE = '5250474d56000000';
    VER = '000301';
    REMAIN = '0000000000';

    checkImgIgnore(url) {
        for (let cnt = 0; cnt < this._ignoreList.length; cnt++) {
            if (url === this._ignoreList[cnt]) return true;
        }
        return false;
    }

    decryptImg(url, bitmap) {
        url = this.extToEncryptExt(url);

        const requestFile = new XMLHttpRequest();
        requestFile.open('GET', url);
        requestFile.responseType = 'arraybuffer';
        requestFile.send();

        requestFile.onload = () => {
            if (requestFile.status < this._xhrOk) {
                const arrayBuffer = this.decryptArrayBuffer(requestFile.response);
                bitmap._image.src = this.createBlobUrl(arrayBuffer);
                bitmap._image.addEventListener('load', (bitmap._loadListener = Bitmap.prototype._onLoad.bind(bitmap)));
                bitmap._image.addEventListener(
                    'error',
                    (bitmap._errorListener = bitmap._loader || Bitmap.prototype._onError.bind(bitmap))
                );
            }
        };

        requestFile.onerror = function () {
            if (bitmap._loader) {
                bitmap._loader();
            } else {
                bitmap._onError();
            }
        };
    }

    decryptHTML5Audio(url, bgm, pos) {
        const requestFile = new XMLHttpRequest();
        requestFile.open('GET', url);
        requestFile.responseType = 'arraybuffer';
        requestFile.send();

        requestFile.onload = () => {
            if (requestFile.status < this._xhrOk) {
                const arrayBuffer = this.decryptArrayBuffer(requestFile.response);
                const url = this.createBlobUrl(arrayBuffer);
                AudioManager.createDecryptBuffer(url, bgm, pos);
            }
        };
    }

    cutArrayHeader(arrayBuffer, length) {
        return arrayBuffer.slice(length);
    }

    decryptArrayBuffer(arrayBuffer) {
        if (!arrayBuffer) return null;
        const header = new Uint8Array(arrayBuffer, 0, this._headerlength);

        let i;
        const ref = this.SIGNATURE + this.VER + this.REMAIN;
        const refBytes = new Uint8Array(16);
        for (i = 0; i < this._headerlength; i++) {
            refBytes[i] = parseInt('0x' + ref.substr(i * 2, 2), 16);
        }
        for (i = 0; i < this._headerlength; i++) {
            if (header[i] !== refBytes[i]) {
                throw new Error('Header is wrong');
            }
        }

        arrayBuffer = this.cutArrayHeader(arrayBuffer, this._headerlength);
        const view = new DataView(arrayBuffer);
        this.readEncryptionkey();
        if (arrayBuffer) {
            const byteArray = new Uint8Array(arrayBuffer);
            for (i = 0; i < this._headerlength; i++) {
                byteArray[i] = byteArray[i] ^ parseInt(this._encryptionKey[i], 16);
                view.setUint8(i, byteArray[i]);
            }
        }

        return arrayBuffer;
    }

    createBlobUrl(arrayBuffer) {
        const blob = new Blob([arrayBuffer]);
        return window.URL.createObjectURL(blob);
    }

    extToEncryptExt(url) {
        const ext = url.split('.').pop();
        let encryptedExt = ext;

        if (ext === 'ogg') encryptedExt = '.rpgmvo';
        else if (ext === 'm4a') encryptedExt = '.rpgmvm';
        else if (ext === 'png') encryptedExt = '.rpgmvp';
        else encryptedExt = ext;

        return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
    }

    readEncryptionkey() {
        this._encryptionKey = global.$dataSystem.encryptionKey.split(/(.{2})/).filter(Boolean);
    }
})();
