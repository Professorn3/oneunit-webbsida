import { motion } from 'framer-motion'
import Hero from '../sections/Hero'
import About from '../sections/About'
import GalleryPreview from '../sections/GalleryPreview'
import NewsPreview from '../sections/NewsPreview'
import ApplyCTA from '../sections/ApplyCTA'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

export default function Home() {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <Hero />
      <About />
      <GalleryPreview />
      <NewsPreview />
      <ApplyCTA />
    </motion.div>
  )
}
