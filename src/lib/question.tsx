
export const pickupNQuestions = (n: number) => {
    const questions = [
        "好きな食べ物は何ですか？ / What is your favorite food?",
        "好きな飲み物は何ですか？ / What is your favorite drink?",
        "休日の過ごし方は？ / How do you spend your weekends?",
        "子供の頃の夢は何でしたか？ / What was your childhood dream?",
        "尊敬する人は誰ですか？ / Who do you respect?",
        "好きな映画のジャンルは？ / What is your favorite movie genre?",
        "好きな音楽のジャンルは？ / What is your favorite music genre?",
        "今まで行った旅行先で一番良かったところは？ / What is the best place you have traveled to?",
        "今一番欲しいものは何ですか？ / What do you want the most right now?",
        "好きなスポーツは何ですか？ / What is your favorite sport?",
        "好きな季節はいつですか？ / What is your favorite season?",
        "朝型ですか？夜型ですか？ / Are you a morning person or a night person?",
        "コーヒー派ですか？紅茶派ですか？ / Do you prefer coffee or tea?",
        "好きな動物は何ですか？ / What is your favorite animal?",
        "好きな色は何ですか？ / What is your favorite color?",
        "幸せを感じる瞬間はどんな時ですか？ / When do you feel the happiest?",
        "ストレス解消法は何ですか？ / How do you relieve stress?",
        "自分の長所はどんなところだと思いますか？ / What do you think is your best quality?",
        "自分の短所はどんなところだと思いますか？ / What do you think is your worst quality?",
        "今一番興味があることは何ですか？ / What are you most interested in right now?",
        "子供の頃の思い出で印象に残っているエピソードは？ / What is a memorable childhood memory?",
        "好きな本のジャンルは何ですか？ / What is your favorite book genre?",
        "好きなテレビ番組は何ですか？ / What is your favorite TV show?",
        "好きな花は何ですか？ / What is your favorite flower?",
        "好きな漫画やアニメは何ですか？ / What is your favorite manga or anime?",
        "好きなキャラクターは誰ですか？ / Who is your favorite character?",
        "最近ハマっていることは何ですか？ / What are you into lately?",
        "一番感動した映画は何ですか？ / What is the most touching movie you have seen?",
        "一番印象に残っている本は何ですか？ / What is the most memorable book you have read?",
        "将来の夢は何ですか？ / What is your dream for the future?"
      ];
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}