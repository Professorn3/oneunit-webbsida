import React from 'react'
import { motion } from 'framer-motion'
import ScrambleText from '../components/ScrambleText'
import './About.css'

export default function About() {
  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <header className="about-header">
          <h1 className="about-title"><ScrambleText text="OM OSS" /></h1>
          <div className="about-divider" />
        </header>

        <div className="about-content">
          <motion.div 
            className="about-text-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>VILKA ÄR ONEUNIT?</h2>
            <p>
              OneUnit är mer än bara en grupp motorcyklister; vi är en gemenskap formad av en gemensam passion för frihet, lojalitet och kärleken till den öppna vägen. Vi grundades med en enkel och tydlig vision: att bygga en sammanhållning där varje medlem är en del av något större – en enda enhet, en <strong>OneUnit</strong>. Vår gemenskap består av människor från världens alla hörn, och vi välkomnar alla oavsett bakgrund, kultur eller etnicitet.
            </p>
            <p style={{ marginTop: '1rem' }}>
              Vi är entusiaster som sätter oss på hojen för att rensa tankarna, och vi delar gärna den upplevelsen med varandra. Vårt mål är inte att skapa oreda; tvärtom präglas vi av en djup ömsesidig respekt, både för varandra och för vår omgivning i trafiken och i vardagen. Att vara en del av OneUnit är en livsstil. Vi bär med oss våra värderingar oavsett om vi sitter på motorcykeln, är på jobbet eller umgås med familjen. Vi är lyhörda och kommunikativa, drivs inte av prestige eller att mäta oss med andra, och vi hyser största respekt för myndigheter och samhället i stort.
            </p>
          </motion.div>

          <motion.div 
            className="about-text-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2>VÅRA VÄRDERINGAR</h2>
            <p>
              Respekt är vår valuta. Vi värderar människor utifrån deras handlingar och att de står vid sitt ord, aldrig efter bakgrund eller titel. På vägarna lämnar vi aldrig en medlem bakom oss – vi står starka tillsammans, i vått och torrt.
            </p>
            <p style={{ marginTop: '1rem' }}>
              Det absolut viktigaste för oss är en villkorslös respekt för varandra. Vårt nyckelord är <strong>prestigelöst</strong>. Hos oss finns inga hierarkier eller pyramider; vi är alla på samma nivå och har exakt samma värde. Varje medlem har en självklar rätt att uttrycka sina åsikter och tankar. Vi är individer, familjemedlemmar och vänner – och vi förväntar oss att alla möts med samma ödmjukhet och jämlikhet.
            </p>
          </motion.div>

          <motion.div 
            className="about-text-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2>GÅ MED I GEMENSKAPEN</h2>
            <p>
              Vi är ständigt på jakt efter hängivna personer som delar våra ideal och vår passion. Att bli en del av OneUnit ger dig tillgång till våra exklusiva plattformar, privata chattar, meetups och unika gemensamma events. Känner du att du delar vår vision och har vad som krävs? Ta steget och ansök om medlemskap redan idag.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
