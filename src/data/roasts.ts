export const ROAST_QUOTES: string[] = [
  "Cầu thủ bóng đá hay thợ ném bóng nước đấy?",
  "Ngón tay bạn bị đơ hay màn hình dính dầu mỡ vậy?",
  "Bạn vừa lập kỷ lục vỡ bóng nhanh nhất dải ngân hà!",
  "Quả bóng nói: 'Xin người hãy buông tha cho tôi...'",
  "Thêm 1 lần vỡ nữa là đủ mở tiệm thu mua ve chai thủy tinh rồi đấy!",
  "Suýt thắng rồi... nhưng từ 'suýt' tới 'thắng' cách nhau 1 vòng trái đất!",
  "Bạn vừa hiến tế quả bóng thứ {deaths} cho nền khoa học vũ trụ!",
  "Quả bóng vừa nhìn thấy bạn đã tự nứt vì sợ hãi...",
  "Độ nghiêng của khay: 45 độ. Độ cay cú trong lòng bạn: 1000 độ C!",
  "Nếu mỗi lần vỡ bóng được 1.000đ thì bạn đã mua được căn nhà rồi.",
  "Tay trái bấm một đằng, tay phải phóng một nẻo. Quá tài tình!",
  "Trọng lực không ghét bạn, vũ trụ cũng không ghét bạn. Do bạn trượt tay thôi!",
  "Vỡ bóng không đáng sợ, đáng sợ là vừa vỡ vừa tưởng mình sắp thắng!",
  "Robot: 'Chủ nhân ơi, con mang khay chứ con không mang chảo xào lăn!'",
  "Ai đó gửi video pha này lên TikTok chắc chắn triệu view cười bể bụng!",
  "Bạn có chắc bạn đang nhìn vào màn hình không đấy?",
  "Một pha xử lý đi vào lòng đất... theo đúng nghĩa đen!",
  "Đừng đập điện thoại nhé, tiền màn hình đắt hơn tiền mua game đấy!",
  "Bình tĩnh hít sâu thở đều, rồi... vỡ tiếp quả nữa nào!",
  "Kéo lực 100% nhưng độ chính xác 0%. Nghệ thuật là ánh trăng lừa dối!",
  "Thần thăng bằng đã rời khỏi cuộc trò chuyện vì quá bất lực.",
  "Ngồi ngay ngắn lại, lau tay vào áo, và thử lại ngay lập tức xem nào!",
];

export const VICTORY_QUOTES: string[] = [
  "Đỉnh nóc kịch trần! Bạn đúng là Thần Cân Quả Cầu!",
  "Cuối cùng cũng qua được! Cảm giác dopamine bùng nổ chưa?",
  "Thần rùa hiển linh hay tay nghề đỉnh cao đây?",
  "Pha tiếp đất mẫu mực xứng đáng 10 điểm từ ban giám khảo!",
  "Qua màn rồi, mau share ảnh khoe ngay kẻo người ta tưởng bạn nói dối!",
];

export function getRandomRoast(deaths: number): string {
  const template = ROAST_QUOTES[Math.floor(Math.random() * ROAST_QUOTES.length)];
  return template.replace('{deaths}', deaths.toString());
}

export function getRandomVictoryQuote(): string {
  return VICTORY_QUOTES[Math.floor(Math.random() * VICTORY_QUOTES.length)];
}
