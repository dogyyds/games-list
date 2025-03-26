"use client";
import {
  useState,
  useEffect,
  useCallback,
  memo,
  useRef,
  SetStateAction,
} from "react";
import Head from "next/head";
import styles from "../styles/Games.module.css";
import gamesData from "../gamesArray.json";

// 定义类型接口
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface GameCardProps {
  game: {
    id: number;
    teamName: string | number;
    gameName?: string | null;
    shortDescription?: string | null;
    gameDescription?: string | null;
    instructions?: string | null;
    teamMembers?: string | null;
    baiduPanLink?: string | null;
    downloadLink?: string | null;
  };
  playedGames: number[];
  onTogglePlayed: (id: number) => void;
}

// 添加Modal组件用于显示游戏详情
const Modal = memo(({ isOpen, onClose, children }: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 锁定背景滚动
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    // ESC键关闭模态框
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <div
        className={styles.modalContent}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className={styles.closeButton}
          aria-label="关闭"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
});

Modal.displayName = "Modal";

// Define a Game interface based on your data structure
interface Game {
  id: number;
  teamName: string | number; // 允许 teamName 可以是字符串或数字
  gameName?: string | null;
  shortDescription?: string | null;
  gameDescription?: string | null;
  instructions?: string | null;
  teamMembers?: string | null;
  baiduPanLink?: string | null;
  downloadLink?: string | null;
  reviewResult?: string | null;
}

export default function Games() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [randomGame, setRandomGame] = useState<Game | null>(null);
  const [showRandomGame, setShowRandomGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playedGames, setPlayedGames] = useState<number[]>([]);
  const [playedFilter, setPlayedFilter] = useState("all"); // "all", "played", "notPlayed"

  // 添加模态框状态
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 模态框打开和关闭处理
  const handleOpenModal = useCallback((game: Game) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // 延迟清除选中的游戏，保证动画效果完成后再清理数据
    setTimeout(() => setSelectedGame(null), 300);
  }, []);

  // 使用useCallback优化函数引用
  const handleSearchChange = useCallback(
    (e: { target: { value: SetStateAction<string> } }) => {
      setSearchTerm(e.target.value);
    },
    []
  );

  const handleTogglePlayed = useCallback((gameId: any) => {
    setPlayedGames((prev) => {
      const newPlayedGames = prev.includes(gameId)
        ? prev.filter((id) => id !== gameId)
        : [...prev, gameId];

      // 保存到localStorage
      localStorage.setItem("playedGames", JSON.stringify(newPlayedGames));
      return newPlayedGames;
    });
  }, []);

  const handleRandomSort = useCallback(() => {
    const shuffled = [...filteredGames].sort(() => 0.5 - Math.random());
    setFilteredGames(shuffled);
  }, [filteredGames]);

  const handleGetRandomGame = useCallback(() => {
    if (games.length > 0) {
      const randomIndex = Math.floor(Math.random() * games.length);
      setRandomGame(games[randomIndex]);
      setShowRandomGame(true);
    }
  }, [games]);

  const handleBackToList = useCallback(() => {
    setShowRandomGame(false);
  }, []);

  const handlePlayedFilterChange = useCallback(
    (filter: SetStateAction<string>) => {
      setPlayedFilter(filter);
    },
    []
  );

  // 初始化数据
  useEffect(() => {
    setIsLoading(true);

    // 从localStorage加载已玩过的游戏
    try {
      const savedPlayedGames = localStorage.getItem("playedGames");
      if (savedPlayedGames) {
        setPlayedGames(JSON.parse(savedPlayedGames));
      }
    } catch (error) {
      console.error("Failed to load played games from localStorage:", error);
    }

    // 使用setTimeout模拟数据加载，实际项目中可以移除
    const timer = setTimeout(() => {
      // 确保类型安全
      setGames(gamesData as Game[]);
      setFilteredGames(gamesData as Game[]);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 搜索和筛选功能
  useEffect(() => {
    let results = games;

    // 文本搜索
    if (searchTerm.trim()) {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter((game) => {
        const searchableFields = [
          game.teamName,
          game.gameName,
          game.shortDescription,
          game.gameDescription,
          game.teamMembers,
        ].filter(Boolean); // 过滤掉 null 或 undefined 值

        return searchableFields.some(
          (field) =>
            field?.toString().toLowerCase().includes(lowercasedTerm) ?? false
        );
      });
    }

    // 已玩过筛选
    if (playedFilter === "played") {
      results = results.filter((game) => playedGames.includes(game.id));
    } else if (playedFilter === "notPlayed") {
      results = results.filter((game) => !playedGames.includes(game.id));
    }

    setFilteredGames(results);
  }, [searchTerm, games, playedFilter, playedGames]);

  // 修改 GameCard 组件，移除内部模态框状态
  const GameCard = memo(
    ({ game, playedGames, onTogglePlayed }: GameCardProps) => {
      // 处理空或null值
      const gameName = game.gameName || "未命名游戏";
      const shortDescription = game.shortDescription || "暂无简介";
      const downloadLink = game.downloadLink || "";

      const isPlayed = playedGames.includes(game.id);

      const handleTogglePlayed = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          e.stopPropagation();
          onTogglePlayed(game.id);
        },
        [game.id, onTogglePlayed]
      );

      return (
        <div
          className={`${styles.card} ${isPlayed ? styles.playedCard : ""} ${
            styles.hoverCard
          }`}
        >
          <div className={styles.cardHeader}>
            <h2>{gameName}</h2>
            <span className={styles.teamName}>
              由 {game.teamName.toString()} 制作{" "}
              <span className={styles.gameId}>ID: {game.id}</span>
            </span>
          </div>

          <div className={styles.cardContent}>
            <p className={styles.shortDescription}>{shortDescription}</p>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.cardActions}>
              <button
                onClick={() => handleOpenModal(game)}
                className={`${styles.detailsButton} ${styles.buttonHover}`}
              >
                查看详情
              </button>

              {downloadLink && (
                <a
                  href={downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.downloadButton} ${styles.buttonHover}`}
                >
                  下载游戏
                </a>
              )}
            </div>

            <div className={styles.playedContainer}>
              <label className={styles.playedLabel}>
                <input
                  type="checkbox"
                  checked={isPlayed}
                  onChange={handleTogglePlayed}
                  className={styles.playedCheckbox}
                />
                <span>已玩过</span>
              </label>
            </div>
          </div>
        </div>
      );
    }
  );

  GameCard.displayName = "GameCard";

  return (
    <div className={styles.container}>
      <Head>
        <title>游戏展示 - 034 GameJam</title>
        <meta name="description" content="034 GameJam 游戏作品展示" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <main className={styles.main}>
        <div className={styles.titleContainer}>
          <h1 className={`${styles.title} ${styles.fadeInDown}`}>
            034 GameJam 游戏作品展示
          </h1>
          <a
            href="https://dogxi.me"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.authorTag} ${styles.bounce}`}
          >
            by Dogxi
          </a>
        </div>

        <div className={`${styles.controls} ${styles.fadeInUp}`}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="搜索游戏、团队或描述..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.sortButtons}>
              <button onClick={handleRandomSort} className={styles.buttonHover}>
                随机排序
              </button>
              <button
                onClick={handleGetRandomGame}
                className={styles.buttonHover}
              >
                随机获取一个游戏
              </button>
            </div>

            <div className={styles.playedFilter}>
              <span>筛选：</span>
              <button
                onClick={() => handlePlayedFilterChange("all")}
                className={playedFilter === "all" ? styles.activeFilter : ""}
              >
                全部
              </button>
              <button
                onClick={() => handlePlayedFilterChange("played")}
                className={playedFilter === "played" ? styles.activeFilter : ""}
              >
                已玩过
              </button>
              <button
                onClick={() => handlePlayedFilterChange("notPlayed")}
                className={
                  playedFilter === "notPlayed" ? styles.activeFilter : ""
                }
              >
                未玩过
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`${styles.loadingContainer} ${styles.fadeIn}`}>
            <div className={styles.loader}></div>
            <p>正在加载游戏数据...</p>
          </div>
        ) : showRandomGame && randomGame ? (
          <div className={`${styles.randomGameContainer} ${styles.fadeIn}`}>
            <h2>随机游戏推荐</h2>
            <div className={styles.randomGame}>
              <GameCard
                game={randomGame}
                playedGames={playedGames}
                onTogglePlayed={handleTogglePlayed}
              />
            </div>
            <button
              onClick={handleBackToList}
              className={`${styles.backButton} ${styles.buttonHover}`}
            >
              返回游戏列表
            </button>
          </div>
        ) : (
          <>
            <div className={`${styles.gamesGrid} ${styles.fadeIn}`}>
              {filteredGames.map((game, index) => (
                <div
                  key={game.id}
                  className={`${styles.fadeInUp}`}
                  style={{ animationDelay: `${Math.min(0.03 * index, 1)}s` }}
                >
                  <GameCard
                    game={game}
                    playedGames={playedGames}
                    onTogglePlayed={handleTogglePlayed}
                  />
                </div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className={`${styles.noResults} ${styles.fadeIn}`}>
                <p>没有找到匹配的游戏，请尝试其他搜索关键词</p>
              </div>
            )}
          </>
        )}

        <div className={`${styles.statsContainer} ${styles.fadeInUp}`}>
          <p>
            共展示 {filteredGames.length} 个游戏（总共 {games.length} 个）
            {playedGames.length > 0 && `，已玩过 ${playedGames.length} 个`}
          </p>
        </div>

        {/* 在返回的 JSX 末尾添加模态框组件 */}
        {isModalOpen && selectedGame && (
          <Modal isOpen={true} onClose={handleCloseModal}>
            <div className={styles.gameDetailContainer}>
              <h2 className={styles.modalGameTitle}>
                {selectedGame.gameName || "未命名游戏"}
              </h2>
              <div className={styles.modalTeamInfo}>
                <span>团队: {selectedGame.teamName.toString()}</span>
              </div>

              {selectedGame.shortDescription && (
                <div className={styles.modalSection}>
                  <h3>简介</h3>
                  <p>{selectedGame.shortDescription}</p>
                </div>
              )}

              {selectedGame.gameDescription && (
                <div className={styles.modalSection}>
                  <h3>游戏介绍</h3>
                  <p className={styles.gameDescription}>
                    {selectedGame.gameDescription
                      .split("\n")
                      .map((line, index) => (
                        <span key={index}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                </div>
              )}

              {selectedGame.instructions && (
                <div className={styles.modalSection}>
                  <h3>操作指南</h3>
                  <p className={styles.instructions}>
                    {selectedGame.instructions
                      .split("\n")
                      .map((line, index) => (
                        <span key={index}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                </div>
              )}

              {selectedGame.teamMembers && (
                <div className={styles.modalSection}>
                  <h3>团队成员</h3>
                  <p className={styles.teamMembers}>
                    {selectedGame.teamMembers.split("\n").map((line, index) => (
                      <span key={index}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {selectedGame.downloadLink && (
                <div className={styles.modalActions}>
                  <a
                    href={selectedGame.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.modalDownloadButton} ${styles.buttonHover}`}
                  >
                    下载游戏
                  </a>
                </div>
              )}
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
