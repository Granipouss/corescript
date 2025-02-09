export const Decrypter = new (class Decrypter {
    hasEncryptedImages = false;
    hasEncryptedAudio = false;

    private _headerlength = 16;
    private _xhrOk = 400;
    private _encryptionKey = [''];
    private _ignoreList = ['img/system/Window.png'];

    readonly SIGNATURE = '5250474d56000000';
    readonly VER = '000301';
    readonly REMAIN = '0000000000';

    checkImgIgnore(url: string): boolean {
        for (let cnt = 0; cnt < this._ignoreList.length; cnt++) {
            if (url === this._ignoreList[cnt]) return true;
        }
        return false;
    }

    decrypt(url: string, onload: (source: string) => void, onerror?: () => void): void {
        const requestFile = new XMLHttpRequest();
        requestFile.open('GET', url);
        requestFile.responseType = 'arraybuffer';
        requestFile.send();

        requestFile.onload = (): void => {
            if (requestFile.status < this._xhrOk) {
                const arrayBuffer = this.decryptArrayBuffer(requestFile.response);
                const source = this.createBlobUrl(arrayBuffer);
                onload(source);
            }
        };

        requestFile.onerror = onerror;
    }

    cutArrayHeader(arrayBuffer: ArrayBuffer, length: number): ArrayBuffer {
        return arrayBuffer.slice(length);
    }

    decryptArrayBuffer(arrayBuffer: ArrayBuffer): ArrayBuffer {
        if (!arrayBuffer) return null;
        const header = new Uint8Array(arrayBuffer, 0, this._headerlength);

        const ref = this.SIGNATURE + this.VER + this.REMAIN;
        const refBytes = new Uint8Array(16);
        for (let i = 0; i < this._headerlength; i++) {
            refBytes[i] = parseInt('0x' + ref.substr(i * 2, 2), 16);
        }
        for (let i = 0; i < this._headerlength; i++) {
            if (header[i] !== refBytes[i]) {
                throw new Error('Header is wrong');
            }
        }

        arrayBuffer = this.cutArrayHeader(arrayBuffer, this._headerlength);
        const view = new DataView(arrayBuffer);
        this.readEncryptionkey();
        if (arrayBuffer) {
            const byteArray = new Uint8Array(arrayBuffer);
            for (let i = 0; i < this._headerlength; i++) {
                byteArray[i] = byteArray[i] ^ parseInt(this._encryptionKey[i], 16);
                view.setUint8(i, byteArray[i]);
            }
        }

        return arrayBuffer;
    }

    createBlobUrl(arrayBuffer: BlobPart): string {
        const blob = new Blob([arrayBuffer]);
        return window.URL.createObjectURL(blob);
    }

    extToEncryptExt(url: string): string {
        const ext = url.split('.').pop();
        let encryptedExt = ext;

        if (ext === 'ogg') encryptedExt = '.rpgmvo';
        else if (ext === 'm4a') encryptedExt = '.rpgmvm';
        else if (ext === 'png') encryptedExt = '.rpgmvp';
        else encryptedExt = ext;

        return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt;
    }

    readEncryptionkey(): void {
        this._encryptionKey = window.$dataSystem.encryptionKey.split(/(.{2})/).filter(Boolean);
    }
})();
