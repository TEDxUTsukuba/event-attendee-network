## イベントの参加者の関係性を可視化システム

### 概要
イベントの参加者同士でのつながりがリアルタイムで可視化されるシステム。
どんな人たちがクラスターを作っているのか、どのようにつながっていくのかを時系列で可視化する。

### なぜやるのか

- 参加者の特徴と時系列でのクラスター形成を可視化することで、イベントの分析を行うことができる。
- 視覚的に面白い

### 機能
- must
    - 参加者の情報を登録
        - 名前
        - 3つのその人についての情報
            - ランダムに3つの情報を入力する
            - ex. 趣味、好きな食べ物、好きなアーティスト
    - 参加者同士の関係性を登録
        - 相手のQRコードまたはIDを入力する
            - IDは絵文字で表現するなどの工夫ができるとよさそう
        - 登録する際には、相手の情報を入力することで、登録できる
            - ex. 相手の好きな食べ物を入力して、それが一致した場合に登録できる
    - 参加者同士の関係性を可視化
        - リアルタイムで更新される
        - ネットワーク図で表示
            - クラスターなどを強調したり、色分けするなどの工夫ができるとよい
- nice to have
    - 参加者、登壇者、スタッフを区別して登録
    - 多言語対応


### どう実装するか

- フロントエンド
    - Next.js
    - react-graph-vis
- バックエンド
    - Firebase
        - 面倒くさいので、Firebaseを使う
        - Firestore
        - Authentication
            - つかわないかも
            - イベントごとにユーザーが生えるので
- データ構造
    - events
        - id
        - name
        - attendees
            - id
            - name
            - role
                - audience / speaker / staff / etc...
            - info
                - key
                - value
        - connections
            - id
            - parent_id
            - child_id
            - info
                - keyの配列
            - timestamp
- デザイン
    - とくに考えていない
    - figma
        - https://www.figma.com/file/j48eOqnBk6GGHwFaxUgGPw/Event-Attendance-Network?type=design&node-id=0%3A1&mode=design&t=f4F0gqexIcxZRnLl-1


## Getting Started

yarnで管理してます。