import React from 'react'
import { motion } from 'framer-motion'
import './Rules.css'

export default function Rules() {
  const ruleCategories = [
    {
      title: 'I. DIGITAL NÄRVARO (HEMSIDAN)',
      icon: '▪',
      rules: [
        'Respektfull ton gäller alltid. Inga personpåhopp eller drama i chatten.',
        'Det som skrivs internt på sidan stannar på sidan. Läckage av medlemsinformation leder till omedelbar uteslutning.',
        'Spam eller onödig reklam är strängt förbjudet.',
        'Klubbens officiella beslut kommuniceras enbart av admins via Nyheter eller direkt i chatten.',
        'Har du frågor, funderingar eller åsikter kring regler? Säg till i chatten! Vi vill ständigt göra hemsidan bättre. Tycker du en regel bör ändras så kollar vi vad majoriteten tycker. Vi bestämmer allt tillsammans.'
      ]
    },
    {
      title: 'II. VID TRÄFFAR & MÖTEN',
      icon: '▪',
      rules: [
        'Tider respekteras. Om samling är satt till ett visst klockslag, är du tankad och klar då.',
        'Respekt mot varandra är ett måste. Vid fysiska möten lämnas konflikter hemma.',
        'Vi bär inga västar, utan vanliga kläder, men ifall vi bär vår merch så gör vi det med stolthet. Möjlighet finns för merch med personlig text/namn, men tänk på att utomstående då kan identifiera dig. Du väljer helt själv.',
        'Under alla möten och meetups utser vi en person som leder gruppen för att slippa krångel. Denna person ska respekteras.',
        'Att utföra stunts eller burnouts sker helt på egen risk. Vi bestämmer inte vad du gör, men vi rekommenderar starkt att du gör det lagligt.'
      ]
    },
    {
      title: 'III. UTE PÅ VÄGARNA (RIDES)',
      icon: '▪',
      rules: [
        'Ride-ledaren leder ritten. Eventuella instruktioner tar vi på plats eller i chatten innan start.',
        'Säkerhet går först. Vi håller ett bra och säkert avstånd till varandra så vi inte riskerar att köra ihop.',
        'Du bestämmer själv på hur många hjul du kör och i vilken hastighet. Vi kan dock bara rekommendera att man håller sig på två hjul, respekterar gällande hastighetsbegränsningar och tänker på säkerheten.',
        'Om en medlem får motorstopp eller problem stannar vi alla tillsammans tills vidare beslut tas gemensamt.',
        'Vi respekterar alltid andra trafikanter, men förväntar oss också att de respekterar oss. Vi är inte ute efter problem – vi vill bara ha frihet.'
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
