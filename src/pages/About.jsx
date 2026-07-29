import React from 'react'
import { motion } from 'framer-motion'
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
          <h1 className="about-title">OM <span>OSS</span></h1>
          <div className="about-divider" />
        </header>

        <div className="about-content">
          <motion.div 
            className="about-text-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>VILKA ÄR ONEUNIT MC?</h2>
            <p>
              OneUnit MC är inte bara en motorcykelklubb. Vi är en gemenskap bundet av en passion för frihet, lojalitet och kärleken till den öppna vägen. Vi grundades med en enkel vision: att skapa en gemenskap där varje medlem är en del av något större, en enda enhet, en <strong>OneUnit</strong>.
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
              Respekt är vår valuta. Vi dömer ingen efter bakgrund eller titel utan efter hur man agerar och står vid sitt ord. På vägarna lämnar vi aldrig en medlem bakom oss. Vi står starka tillsammans i vått och torrt.
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
              Vi letar ständigt efter hängivna mc-förare som delar våra ideal. Att bli en del av OneUnit MC innebär att du får tillgång till våra exklusiva privata sidor, klubbchattar, meetups och gemensamma rideouts. Känner du att du har vad som krävs? Gå in och ansök om medlemskap redan idag.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
