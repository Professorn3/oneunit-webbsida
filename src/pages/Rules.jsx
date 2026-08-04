import React from 'react'
import { motion } from 'framer-motion'
import './Rules.css'

export default function Rules() {
  const ruleCategories = [
    {
      title: 'I. DIGITAL NÄRVARO (HEMSIDAN)',
      icon: '▪',
      rules: [
        'Respektfull ton gäller alltid. Inga personpåhopp eller drama i klubbchatten.',
        'Det som skrivs internt på sidan stannar på sidan. Läckage av medlemsinformation leder till omedelbar uteslutning.',
        'Spam eller onödig reklam är strängt förbjudet.',
        'Klubbens officiella beslut kommuniceras enbart av admins via Nyheter eller direkt i chatten.'
      ]
    },
    {
      title: 'II. VID TRÄFFAR & MÖTEN',
      icon: '▪',
      rules: [
        'Tider respekteras. Om samling är satt till ett visst klockslag, är du tankad och klar då.',
        'Respekt mot bröder och systrar. Vid fysiska möten lämnas konflikter hemma.',
        'Klubbens märken och kläder (Merch) bärs med stolthet. Vid officiella meetups gäller väst eller klubbtröja om inget annat angetts.',
        'Under möten lyssnar vi på den som för ordet. Inga avbrott när viktig information delas.'
      ]
    },
    {
      title: 'III. UTE PÅ VÄGARNA (RIDEOUTS)',
      icon: '▪',
      rules: [
        'Road Captain leder ritten, Tail Gunner stänger kön. Deras instruktioner följs utan undantag.',
        'Säkerhet går först. Inga onödiga risktaganden eller stunts på allmän väg när vi rider i formation.',
        'Håll din position i gruppen (staggered formation) och lämna alltid tillräckligt med bromsavstånd.',
        'Om en medlem får motorstopp eller problem, stannar hela gruppen tills problemet är löst eller Road Captain ger andra order.',
        'Visa respekt för andra trafikanter – vi representerar OneUnit i allt vi gör.'
      ]
    }
  ]

  return (
    <motion.div 
      className="rules-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container">
        <header className="rules-header">
          <h1 className="rules-title">KODE<span>X</span></h1>
          <p className="rules-subtitle">REGLER FÖR MEDLEMMAR & ADMINS</p>
          <div className="rules-divider" />
        </header>

        <div className="rules-content">
          <p className="rules-intro">
            För att OneUnit ska fungera som en gemenskap krävs struktur och ömsesidig respekt. 
            Dessa regler är fundamentet för vår gemenskap. Läs, förstå och lev efter dem.
          </p>

          <div className="rules-grid">
            {ruleCategories.map((category, idx) => (
              <motion.section 
                key={category.title}
                className="rule-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                <h2 className="rule-card__title">
                  <span className="rule-card__icon">{category.icon}</span>
                  {category.title}
                </h2>
                <ul className="rule-card__list">
                  {category.rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
