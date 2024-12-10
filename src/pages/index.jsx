import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import { 
  IconButton, 
  Slider, 
  Box, 
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  SkipNext, 
  SkipPrevious, 
  Shuffle, 
  Repeat,
  QueueMusic,
  Favorite,
  FavoriteBorder,
  VolumeUp,
  VolumeDown,
  VolumeMute
} from '@mui/icons-material';
import './styles.css';
import ReactDOM from 'react-dom'; // Add this import at the top

const purpleTheme = createTheme({
  palette: {
    primary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    secondary: {
      main: '#e1bee7',
    },
  },
});

const AudioContextInstance = createContext(null);

const FallingHearts = () => {
  useEffect(() => {
    const createHeart = () => {
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.style.left = Math.random() * 100 + 'vw';
      heart.style.animationDuration = Math.random() * 3 + 2 + 's';
      heart.style.opacity = Math.random();
      heart.innerText = '❤️';
      document.body.appendChild(heart);

      setTimeout(() => {
        heart.remove();
      }, 5000);
    };

    const interval = setInterval(createHeart, 300);
    return () => clearInterval(interval);
  }, []);

  return <div className="hearts-container" />;
};

const FallingLeaves = () => {
  useEffect(() => {
    const leaves = ['🍁', '🍂', '🌰', '🍄'];
    const createLeaf = () => {
      const leaf = document.createElement('div');
      leaf.className = 'leaf';
      leaf.style.left = Math.random() * 100 + 'vw';
      leaf.style.animationDuration = Math.random() * 5 + 3 + 's';
      leaf.style.opacity = Math.random();
      leaf.innerText = leaves[Math.floor(Math.random() * leaves.length)];
      document.body.appendChild(leaf);

      setTimeout(() => {
        leaf.remove();
      }, 8000);
    };

    const interval = setInterval(createLeaf, 400);
    return () => clearInterval(interval);
  }, []);

  return <div className="leaves-container" />;
};

const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const { analyserNode } = useContext(AudioContextInstance);

  useEffect(() => {
    const animate = () => {
      if (!analyserNode) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const data = new Uint8Array(analyserNode.frequencyBinCount);
      
      analyserNode.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / data.length) * 2.5;
      let x = 0;
      
      for(let i = 0; i < data.length; i++) {
        const barHeight = data[i] / 2;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#9c27b0');  // Purple
        gradient.addColorStop(0.5, '#ba68c8'); // Light purple
        gradient.addColorStop(1, '#7b1fa2');   // Dark purple
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode]);

  return (
    <canvas 
      ref={canvasRef} 
      width="300" 
      height="60" 
      style={{ width: '100%', height: '60px' }}
    />
  );
};

const playlist = [
  {
    id: 1,
    title: "Blue",
    artist: "Yung Kai",
    coverUrl: "/assets/images/10.jpg",
    audioUrl: "YOUR_AUDIO_URL_1"
  },
  // Add more songs here
];

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const { setAudioContext, setAnalyserNode } = useContext(AudioContextInstance);

  useEffect(() => {
    const audio = document.getElementById('bgMusic');
    let isContextInitialized = false;
    
    const initAudioContext = () => {
      if (!isContextInitialized) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaElementSource(audio);
        const analyser = audioCtx.createAnalyser();
        
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        setAudioContext(audioCtx);
        setAnalyserNode(analyser);
        isContextInitialized = true;
      }
      document.removeEventListener('click', initAudioContext);
    };

    document.addEventListener('click', initAudioContext);
    
    audio.addEventListener('error', (e) => {
      console.error('Error loading audio:', e);
    });

    audio.addEventListener('loadeddata', () => {
      console.log('Audio loaded successfully');
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('error', () => {});
      audio.removeEventListener('loadeddata', () => {});
      document.removeEventListener('click', initAudioContext);
    };
  }, [volume, setAudioContext, setAnalyserNode]);

  const updateProgress = () => {
    const audio = document.getElementById('bgMusic');
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleProgressClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const audio = document.getElementById('bgMusic');
    audio.currentTime = position * duration;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    const audio = document.getElementById('bgMusic');
    audio.volume = newVolume;
  };

  const toggleShuffle = () => setIsShuffling(!isShuffling);
  const toggleRepeat = () => setIsRepeating(!isRepeating);

  const toggleMusic = async () => {
    const audio = document.getElementById('bgMusic');
    try {
      if (isPlaying) {
        await audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const nextSong = () => {
    setCurrentSongIndex((prev) => 
      isShuffling 
        ? Math.floor(Math.random() * playlist.length)
        : (prev + 1) % playlist.length
    );
  };

  const prevSong = () => {
    setCurrentSongIndex((prev) => 
      prev === 0 ? playlist.length - 1 : prev - 1
    );
  };

  return (
    <ThemeProvider theme={purpleTheme}>
      <Paper 
        elevation={3} 
        component={motion.div}
        whileHover={{ scale: 1.02 }}
        className="audio-player"
        sx={{
          background: 'linear-gradient(145deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          '& .MuiIconButton-root': {
            color: 'white',
          },
          '& .MuiTypography-root': {
            color: 'white',
          },
          '& .MuiSlider-root': {
            color: '#e1bee7',
          },
          '& .MuiListItem-root.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '& .MuiListItem-root:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="song-info"
          >
            <img 
              src={playlist[currentSongIndex].coverUrl} 
              alt="Album Art" 
              className="album-art"
            />
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6">{playlist[currentSongIndex].title}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {playlist[currentSongIndex].artist}
              </Typography>
            </Box>
            <IconButton onClick={() => setLiked(!liked)}>
              {liked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
          </motion.div>

          <AudioVisualizer />

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <IconButton onClick={toggleShuffle} color={isShuffling ? "primary" : "default"}>
                <Shuffle />
              </IconButton>
              <IconButton onClick={prevSong}>
                <SkipPrevious />
              </IconButton>
              <IconButton onClick={toggleMusic}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton onClick={nextSong}>
                <SkipNext />
              </IconButton>
              <IconButton onClick={toggleRepeat} color={isRepeating ? "primary" : "default"}>
                <Repeat />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>{formatTime(currentTime)}</Typography>
              <Slider
                value={currentTime}
                max={duration}
                onChange={(_, value) => {
                  const audio = document.getElementById('bgMusic');
                  audio.currentTime = value;
                }}
              />
              <Typography>{formatTime(duration)}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setShowPlaylist(!showPlaylist)}>
              <QueueMusic />
            </IconButton>
            <IconButton>
              {volume === 0 ? <VolumeMute /> : volume < 0.5 ? <VolumeDown /> : <VolumeUp />}
            </IconButton>
            <Slider
              sx={{ width: 100 }}
              value={volume}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
            />
          </Box>

          <AnimatePresence>
            {showPlaylist && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <List>
                  {playlist.map((song, index) => (
                    <ListItem 
                      key={song.id}
                      button
                      selected={currentSongIndex === index}
                      onClick={() => setCurrentSongIndex(index)}
                    >
                      <ListItemText 
                        primary={song.title}
                        secondary={song.artist}
                      />
                    </ListItem>
                  ))}
                </List>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Paper>
    </ThemeProvider>
  );
};

const Gallery = ({ onImageSelect }) => {
  const images = ['/assets/images/1.jpg', '/assets/images/2.jpg', '/assets/images/11.jpg'];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <Box sx={{ mt: 3, mb: 2 }}>
      <Typography variant="h6" sx={{ color: 'black', mb: 2, textAlign: 'center' }}>
        Our Memories 💝
      </Typography>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="gallery-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '0.5rem',
          maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)'
        }}
      >
        {images.map((src, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.05, zIndex: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onImageSelect(src)}
            style={{
              overflow: 'hidden',
              borderRadius: '8px',
              cursor: 'pointer',
              aspectRatio: '1',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              position: 'relative'
            }}
          >
            <motion.img
              src={src}
              alt={`Memory ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0.5rem',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: 'white',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}
            >
              Memory {index + 1}
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
};

const Index = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyserNode, setAnalyserNode] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const ImageModal = ({ image, onClose }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        cursor: 'pointer',
        padding: 0
      }}
    >
      <motion.img
        src={image}
        alt="Selected memory"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        style={{
          maxWidth: '95%',
          maxHeight: '95%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: '8px',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );

  return (
    <AudioContextInstance.Provider value={{ 
      audioContext, 
      setAudioContext, 
      analyserNode, 
      setAnalyserNode 
    }}>
      <div className="container">
        <audio id="bgMusic" preload="auto">
          <source src="/assets/audio/music.mp3" type="audio/mp3" />
          Your browser does not support the audio element.
        </audio>
        <FallingHearts />
        <FallingLeaves />
        <div className="content-wrapper">
          {!isOpen && <div className="open-message">Open it Lovie hehe</div>}
          <div className={`envelope ${isOpen ? 'open' : ''}`} onClick={() => !isOpen && setIsOpen(true)}>
            <div className="front flap"></div>
            <div className="front pocket"></div>
            <div className="back"></div>
          </div>
          
          <div className={`letter-wrapper ${isOpen ? 'visible' : ''}`}>
            <div className="split-content">
              <div className="letter-side">
                <div className="letter-content" style={{ 
                  padding: '0.5rem'
                }}>
                  <h1 style={{ 
                    marginBottom: '0.5rem', 
                    textAlign: 'center',
                    fontSize: '1.5rem' 
                  }}>Happy 3rd Monthsary! 💝</h1>
                  <div className="letter-body" style={{ 
                    textAlign: 'justify', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                    lineHeight: '1.3'
                  }}>
                    <p>Hello My Future Wifeeyy😚</p>
                    <p>happy 3rd monthsary💜</p>
                    <p>Another month has passed, and here we are celebrating our love once again. It amazes me how fast time flies when I'm with you.</p>
                    <p>I love everything about you—the way you care for me, your beautiful imperfections, and all the little efforts you make just to see me smile and I can say that I'm in the right person na. Hunahunaa gud na mag sge rakag hunahuna sa assurance and now you're comfortable with me na. I still missed your kisses and hugs ☹️</p>
                    <p>I'm still thinking about us if we're able to overcome all the challenges that we are facing. I'm still In love with the same person I admired last year and here I am as your boyfriend.</p>
                    <p>Hoping for more months to us loviee, I promise to always be here for you as your boyfriend, your future husband, your best friend, and your soulmate. 😚😚 iloveyou more and more 😚😚 .</p>
                    <p>Thank you for making my world brighter than light. Here all I can say is that I always loved you</p>
                    <p>Happy 3rd monthsary again😚😚 iloveyousomuchh😚😚</p>
                  </div>
                </div>
              </div>
              <div className="player-side">
                <AudioPlayer />
                <Gallery onImageSelect={setSelectedImage} />
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedImage && (
            <ImageModal 
              image={selectedImage} 
              onClose={() => setSelectedImage(null)} 
            />
          )}
        </AnimatePresence>
      </div>
    </AudioContextInstance.Provider>
  );
};

export default Index;