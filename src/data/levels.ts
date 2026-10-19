import { CrocodileData, LevelData, Obstacle } from '../types/game';

export type LevelTheme =
  | 'balanced'
  | 'windy'
  | 'lasers'
  | 'ice'
  | 'bouncy'
  | 'moving'
  | 'storm'
  | 'extreme'
  | 'boss';

/**
 * Helper to generate a level with 20 distinct chasms populated with hungry crocodiles,
 * escalating obstacles, platform types, and environmental hazards.
 */
function create20ChasmLevel(
  id: number,
  title: string,
  subtitle: string,
  parDeaths: number,
  theme: LevelTheme,
  tip: string
): LevelData {
  const chasmCount = 20;
  const obstacles: Obstacle[] = [];
  let currentX = 50;
  const startPos = { x: 90, y: 380 };

  // Starting platform
  const startPlatWidth = Math.max(120, 170 - id * 2);
  obstacles.push({
    id: `start_plat_${id}`,
    type: 'platform',
    x: 30,
    y: 420,
    w: startPlatWidth,
    h: 50,
    color: '#1e293b',
  });
  currentX = 30 + startPlatWidth;

  // Difficulty scaling factor: 1.0 at level 1 to 1.6 at level 20
  const diffMultiplier = 1 + (id - 1) * 0.035;

  for (let c = 1; c <= chasmCount; c++) {
    // Chasm width: escalates with level ID and chasm index
    const baseChasm = 95 + (c % 4) * 12;
    const chasmWidth = Math.min(185, Math.floor(baseChasm * diffMultiplier));
    const pitY = 460;
    const pitHeight = 90;

    // Crocodiles inside this pit (more crocs as level goes up)
    const crocs: CrocodileData[] = [];
    const crocCount = Math.max(2, Math.floor(chasmWidth / (48 - Math.min(15, id * 0.7))));
    for (let cr = 0; cr < crocCount; cr++) {
      crocs.push({
        id: `croc_${id}_${c}_${cr}`,
        x: currentX + cr * (chasmWidth / crocCount) + 8,
        y: pitY + 16,
        w: 40,
        h: 22,
        swimPhase: Math.random() * Math.PI * 2,
        jawOpen: 0,
        isSnapping: false,
      });
    }

    // Crocodile Pit Obstacle
    obstacles.push({
      id: `croc_pit_${id}_${c}`,
      type: 'crocodile_pit',
      x: currentX,
      y: pitY,
      w: chasmWidth,
      h: pitHeight,
      color: '#064e3b',
      crocodiles: crocs,
    });

    currentX += chasmWidth;

    // Platform width: gets narrower as level increases (higher challenge)
    const basePlatWidth = Math.max(68, 125 - id * 2.6 + (c % 3) * 15);
    const platformWidth = Math.floor(basePlatWidth);
    // Platform height variation: sin wave + level variation
    const platformY = 400 + Math.sin(c * 0.75 + id * 0.3) * (35 + Math.min(25, id * 1.2));

    // Choose obstacle / platform type
    const isIce = (theme === 'ice' || theme === 'storm' || id % 3 === 0) && (c % 3 === 1);
    const isBouncy = (theme === 'bouncy' || id % 4 === 0) && (c % 4 === 2);
    const isMoving = (theme === 'moving' || theme === 'extreme' || theme === 'boss' || id >= 5) && (c % 5 === 0);

    if (isBouncy) {
      // Trampoline bouncy platform
      obstacles.push({
        id: `bouncy_${id}_${c}`,
        type: 'bouncy',
        x: currentX,
        y: platformY,
        w: platformWidth,
        h: 28,
        color: '#10b981',
      });
    } else if (isIce) {
      // Slippery ice platform (phanh cháy chân khó hơn!)
      obstacles.push({
        id: `ice_${id}_${c}`,
        type: 'ice',
        x: currentX,
        y: platformY,
        w: platformWidth,
        h: 30,
        color: '#06b6d4',
      });
    } else if (isMoving) {
      // Moving elevator platform
      const speed = 1.2 + (id * 0.08);
      obstacles.push({
        id: `moving_${id}_${c}`,
        type: 'moving_platform',
        x: currentX,
        y: platformY,
        w: platformWidth,
        h: 28,
        color: '#8b5cf6',
        vy: (c % 2 === 0 ? 1 : -1) * speed,
        minY: platformY - 50,
        maxY: platformY + 45,
      });
    } else {
      // Solid cyber platform
      obstacles.push({
        id: `plat_${id}_${c}`,
        type: 'platform',
        x: currentX,
        y: platformY,
        w: platformWidth,
        h: 36,
        color: '#1e293b',
      });
    }

    // Add environmental hazards: Fan (wind) or Laser
    const hasWind = (theme === 'windy' || theme === 'storm' || theme === 'boss' || id % 2 === 0) && (c % 4 === 1);
    const hasLaser = (theme === 'lasers' || theme === 'extreme' || theme === 'boss' || id >= 4) && (c % 4 === 3);

    if (hasWind) {
      const windDir = c % 2 === 0 ? 1 : -1;
      const windMagnitude = 0.16 + Math.min(0.25, id * 0.015);
      obstacles.push({
        id: `fan_${id}_${c}`,
        type: 'fan',
        x: currentX - chasmWidth,
        y: platformY - 140,
        w: chasmWidth + platformWidth,
        h: 140,
        windForce: { x: windDir * windMagnitude, y: -0.04 },
        color: '#38bdf8',
      });
    } else if (hasLaser) {
      const period = Math.max(1.4, 2.4 - id * 0.05);
      const activeTime = Math.min(1.4, 0.9 + id * 0.03);
      obstacles.push({
        id: `laser_${id}_${c}`,
        type: 'laser',
        x: currentX + platformWidth / 2 - 8,
        y: platformY - 170,
        w: 16,
        h: 170,
        color: '#f43f5e',
        laserPeriod: period,
        laserActiveTime: activeTime,
        laserCycle: (c * 0.5 + id * 0.2) % period,
      });
    }

    currentX += platformWidth;
  }

  // End destination platform & Goal portal
  const goalX = currentX + 80;
  const goalY = 370;

  obstacles.push({
    id: `end_plat_${id}`,
    type: 'platform',
    x: currentX,
    y: 410,
    w: 220,
    h: 50,
    color: '#1e293b',
  });

  return {
    id,
    title,
    subtitle,
    parDeaths,
    startPos,
    goal: { x: goalX, y: goalY, radius: 28 },
    chasmCount,
    totalWidth: currentX + 240,
    trayLength: 82,
    tip,
    obstacles,
  };
}

export const GAME_LEVELS: LevelData[] = [
  create20ChasmLevel(
    1,
    "Màn 1: Khởi Đầu Đầm Lầy",
    "20 Vực cá sấu cơ bản · Tập căn lực bắn & phanh chân",
    4,
    'balanced',
    "Kéo súng cao su vừa lực, chú ý phanh kịp thời khi tiếp đất!"
  ),
  create20ChasmLevel(
    2,
    "Màn 2: Gió Nhẹ Bờ Tây",
    "Gió thổi ngang nhẹ nhàng qua 20 vực sâu",
    6,
    'windy',
    "Gió có thể đẩy bay lệch đạn, kéo bù góc để đạn rơi trúng tâm bục!"
  ),
  create20ChasmLevel(
    3,
    "Màn 3: Băng Trơn Rực Lửa",
    "Các bục băng xanh trơn tuột khiến phanh khó gấp đôi",
    8,
    'ice',
    "Bục băng rất trơn! Trang bị kỹ năng 'Móng Vuốt Phanh Dính' trong Shop để bám chặt."
  ),
  create20ChasmLevel(
    4,
    "Màn 4: Laser Nhịp Điệu",
    "Tia laser đỏ quét nhịp nhàng qua các vực sâu",
    10,
    'lasers',
    "Canh đúng nhịp laser tắt rồi thả tay bắn ngay!"
  ),
  create20ChasmLevel(
    5,
    "Màn 5: Bục Lò Xo Tưng Tưng",
    "Bục nhún xanh lá đẩy văng Bé Bông lên cao",
    10,
    'bouncy',
    "Tận dụng bục nhún để bay qua khoảng cách cực xa!"
  ),
  create20ChasmLevel(
    6,
    "Màn 6: Thang Máy Đầm Lầy",
    "Các bục di động nâng lên hạ xuống liên tục",
    12,
    'moving',
    "Căn thời điểm thang máy hạ xuống thấp để tiếp đất an toàn."
  ),
  create20ChasmLevel(
    7,
    "Màn 7: Đảo Nổi Thu Nhỏ",
    "Bục hạ cánh hẹp hơn, đòi hỏi độ chính xác tuyệt đối",
    14,
    'balanced',
    "Dùng súng 'Laze Định Vị' trong Shop để thấy trước điểm rơi 100%!"
  ),
  create20ChasmLevel(
    8,
    "Màn 8: Bão Gió Giật Bờ Đông",
    "Luồng gió đổi hướng làm lệch quỹ đạo bay",
    15,
    'windy',
    "Súng 'Sấm Sét Plasma' giúp xé gió bão không bị thổi lệch."
  ),
  create20ChasmLevel(
    9,
    "Màn 9: Laser & Băng Trượt",
    "Sàn băng trơn kết hợp laser quét sát đầu",
    16,
    'ice',
    "Phanh gấp ngay trên băng để không trượt vào tia laser!"
  ),
  create20ChasmLevel(
    10,
    "Màn 10: Đàn Cá Sấu Cuồng Nộ",
    "Cá sấu đói dày đặc dưới đáy hồ đớp cạp liên tục",
    18,
    'extreme',
    "Mốc thử thách 50% chặng đường! Tập trung cao độ."
  ),
  create20ChasmLevel(
    11,
    "Màn 11: Ma Trận Thang Máy",
    "Nhiều thang máy di chuyển so le theo chu kỳ",
    18,
    'moving',
    "Bật 'Soi Bản Đồ' để quan sát quy luật chuyển động của các bục."
  ),
  create20ChasmLevel(
    12,
    "Màn 12: Bão Lốc Xoáy Đầm Lầy",
    "Gió giật xoay chiều đẩy lùi và cuốn tới",
    20,
    'storm',
    "Tích lực tối đa khi gió thuận chiều để bay vút qua 2 vực một lúc!"
  ),
  create20ChasmLevel(
    13,
    "Màn 13: Bục Nhún Bay Bổng",
    "Bục nhún lò xo liên hoàn trên không trung",
    20,
    'bouncy',
    "Giữ thăng bằng khi tưng nhiều lần liên tiếp."
  ),
  create20ChasmLevel(
    14,
    "Màn 14: Đầm Lầy Băng Trượt Cực Hạn",
    "Băng trơn xen kẽ bục siêu nhỏ",
    22,
    'ice',
    "Kỹ năng 'Dù Lượn Cứu Nguy' sẽ cứu bạn nếu trượt mép vực!"
  ),
  create20ChasmLevel(
    15,
    "Màn 15: Laser Đa Tần Số",
    "Tia laser chớp tắt tốc độ cao",
    24,
    'lasers',
    "Bắn dứt khoát không ngần ngại."
  ),
  create20ChasmLevel(
    16,
    "Màn 16: Vực Thẳm Siêu Rộng",
    "Khoảng cách giữa các bục kéo dài kỷ lục",
    25,
    'extreme',
    "Súng 'Rồng Lửa Bùng Cháy' tăng +25% lực bắn giúp bay vượt vực dễ dàng."
  ),
  create20ChasmLevel(
    17,
    "Màn 17: Cơn Lốc Đỏ & Thang Máy",
    "Gió bão kết hợp sàn di động khó lường",
    26,
    'storm',
    "Kỹ năng 'Nhảy Phản Lực' chạm màn hình giữa không trung để đổi hướng."
  ),
  create20ChasmLevel(
    18,
    "Màn 18: Thang Máy Băng Di Động",
    "Thang máy vừa trôi vừa đóng băng trơn tuột",
    28,
    'ice',
    "Đáp trúng tâm sàn và phanh cháy chân ngay lập tức!"
  ),
  create20ChasmLevel(
    19,
    "Màn 19: Cửa Ngõ Tử Thần",
    "Tổng hòa của laser, gió bão, băng trơn và thang máy",
    30,
    'extreme',
    "Chỉ còn 1 bước nữa là đến Màn 20 Thần Thoại! Cố lên!"
  ),
  create20ChasmLevel(
    20,
    "Màn 20: Đại Chiến Đầm Lầy Thần Thoại",
    "Thử thách tối thượng 20 vực sâu cá sấu đỉnh cao!",
    35,
    'boss',
    "Vượt qua Màn 20 để khắc tên lên Bảng Vàng 'Thần Bắn Đầm Lầy'!"
  ),
];
