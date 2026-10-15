# バーコード読み取り

- 全形式版：<https://3pino.github.io/barcode-reader/>
- Code 128専用版：<https://3pino.github.io/barcode-reader/code128/>
- Code 39専用版：<https://3pino.github.io/barcode-reader/code39/>
- Code 39 / Code 93対応版：<https://3pino.github.io/barcode-reader/code39-93/>
- JAN / EAN専用版：<https://3pino.github.io/barcode-reader/ean/>
- QR専用版：<https://3pino.github.io/barcode-reader/qr/>
- Data Matrix専用版：<https://3pino.github.io/barcode-reader/datamatrix/>

カメラでバーコードを読み取り、文字列をコピーするだけの静的ページです。GASや在庫管理のAPIには接続しません。既存の `nmr-formatter/` とは独立しています。

## 使い方

1. SafariやChromeでページを開くと、自動でカメラの起動・許可要求を行います。
2. カメラの使用を許可し、バーコードを映します。背面カメラを優先します。
3. 読み取れたらカメラが停止します。「コピーして閉じる」を押します。

- 全形式版はJAN / EAN、UPC、Code 128、Code 39、Code 93、QR、Data Matrixなど、ZXingの対応形式を読み取ります。専用版は指定した形式だけを検出します。
- 各ページの背景・ヘッダー・ボタン・入力欄はGAS版のダーク配色と共通の値にそろえています。
- JANから品番を調べる処理はありません。結果を数字に変換せず、先頭の0・改行などをそのままコピーします。ただしEAN/UPCの形式判定など、ZXingによる表現の正規化はあります。
- 読み取ったURLを自動で開くことはありません。
- 開始ボタン・形式切替のnav・h2はありません。各ページをそれぞれのURLで直接開きます。
- 読み取り完了・タブの非表示・ページ離脱時にカメラを解放します。読み直す場合だけ「読み直す」、エラーや停止後は「再試行」を押します。初めから非表示のタブで開いた場合は、最初に表示されたときに自動起動します。
- 画像や読み取り結果をサーバーへ送信せず、履歴やローカルストレージにも保存しません。使用するライブラリも同じサイト内に同梱しています。
- 自動コピーできない場合は結果を選択するので、手動でコピーしてください。
- ブラウザの制限でタブを閉じられない場合は、コピー後に手動で閉じてください。

## 形式限定版

同じ読み取り処理・スタイルを共有し、専用ページではZXingの `possibleFormats` を次の形式だけに限定しています。他形式を検出してから捨てる方式ではありません。

| ページ | 判定対象 |
| --- | --- |
| Code 128 | `CODE_128` |
| Code 39 | `CODE_39` |
| Code 39 / Code 93 | `CODE_39`、`CODE_93` |
| JAN / EAN | `EAN_13`、`EAN_8` |
| QR | `QR_CODE` |
| Data Matrix | `DATA_MATRIX` |

UPC-Aのバー列は先頭0のEAN-13と同じため、JAN / EAN版では13桁のEAN-13として読み取られる場合があります。

他形式の判定を省けるので処理量は減りますが、実機での読み取り速度向上は未計測です。カメラのピント・明るさ・解像度も速度に影響します。ライブラリは共通のため、初回ダウンロードサイズは変わりません。

## 開発・確認

ビルドや依存パッケージのインストールは不要です。

```sh
cd barcode-reader
npm test
python3 -m http.server 8000
```

ローカルは `http://localhost:8000/` で開きます。カメラにはHTTPSまたはlocalhostのセキュアコンテキストが必要です。スマートフォンでLAN内のHTTPアドレスを開いても利用できないため、実機確認には公開HTTPS URLを使ってください。

テストはカメラやクリップボードの制御をモックで確認し、EAN/UPC・Code 128・Code 39・Code 93・QR・Data Matrixのピクセル入力を配信するZXing本体で復号します。各専用版が指定形式を検出し、対象外の形式を拒否することも検証します。実機のカメラ・ブラウザの動作保証ではありません。

## 同梱ライブラリ

- `@zxing/browser@0.1.5` のnpm配布UMDを改変せず使用しています。
- SHA-256：`b5ad3df920738ca7adcb74508d7e6b6a5b9024993fb9a0c702da1ad8964eca07`
- 配布物は `npm pack @zxing/browser@0.1.5` で取得できます。
- 同梱コードの権利表記は `vendor/NOTICE.txt`、ライセンス本文は `vendor/LICENSE-*` を参照してください。
- テスト用ビットマップは架空のデータです。QRとData Matrixは `@zxing/library@0.21.3` で生成し、EAN/UPC・Code 128・Code 39・Code 93は各形式のパターンから作成しています。
