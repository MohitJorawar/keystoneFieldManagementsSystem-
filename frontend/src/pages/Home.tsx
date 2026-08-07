import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wrench, Star, Clock, ShieldCheck, User, Mail, Lock, Loader2, ClipboardList, MessageSquare, Phone } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'
import './Home.css'
import { SplitText } from '../components/SplitText'
import { TextType } from '../components/TextType'
import heroHomeImg from '../assets/hero-home.png'
import { API_BASE_URL } from '../config/api'

gsap.registerPlugin(ScrollTrigger, CustomEase)
import propertyImg1 from '../assets/property-1.png'
import propertyImg2 from '../assets/property-2.png'
import propertyImg3 from '../assets/property-3.png'
import propertyImg4 from '../assets/property-4.png'
import propertyImg5 from '../assets/property-5.png'
import propertyImg6 from '../assets/property-6.png'



interface ServiceCardProps {
  image: string
  category: string
  title: string
  rating: string
  response: string
  warranty: string
  price: string
}

interface AnimatedCounterProps {
  end: number
  suffix?: string
  duration?: number
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easedProgress * end))
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [end, duration])

  return <>{count}{suffix}</>
}

const ServiceCard: React.FC<ServiceCardProps> = ({ image, category, title, rating, response, warranty, price }) => (
  <div className="property-card">
    <div className="property-card-image-wrapper">
      <img src={image} alt={title} className="property-card-image" />
    </div>
    <div className="property-card-content">
      <div className="property-card-address">
        <div className="address-icon-bg">
          <Wrench size={12} className="address-icon" />
        </div>
        <span>{category}</span>
      </div>
      <h3 className="property-card-title">{title}</h3>

      <div className="property-card-features">
        <div className="feature-item">
          <div className="feature-icon-circle">
            <Star size={15} fill="#ffc107" stroke="#ffc107" />
          </div>
          <div className="feature-info">
            <span className="feature-label">Rating</span>
            <span className="feature-value">{rating}</span>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon-circle">
            <Clock size={15} />
          </div>
          <div className="feature-info">
            <span className="feature-label">Response</span>
            <span className="feature-value">{response}</span>
          </div>
        </div>
        <div className="feature-item">
          <div className="feature-icon-circle">
            <ShieldCheck size={15} />
          </div>
          <div className="feature-info">
            <span className="feature-label">Warranty</span>
            <span className="feature-value">{warranty}</span>
          </div>
        </div>
      </div>

      <div className="property-card-footer">
        <span className="property-card-price">{price}</span>
      </div>
    </div>
  </div>
)

const row1Flags = [
  { code: 'za', name: 'South Africa' },
  { code: 'tz', name: 'Tanzania' },
  { code: 'it', name: 'Italy' },
  { code: 'ru', name: 'Russia' },
  { code: 'no', name: 'Norway' },
  { code: 'us', name: 'United States' },
  { code: 'au', name: 'Australia' },
  { code: 'br', name: 'Brazil' },
  { code: 'in', name: 'India' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'gt', name: 'Guatemala' },
  { code: 've', name: 'Venezuela' },
  { code: 'la', name: 'Laos' },
  { code: 'jp', name: 'Japan' },
  { code: 'ca', name: 'Canada' },
]

const row2Flags = [
  { code: 'gr', name: 'Greece' },
  { code: 'cu', name: 'Cuba' },
  { code: 'co', name: 'Colombia' },
  { code: 'mx', name: 'Mexico' },
  { code: 'ch', name: 'Switzerland' },
  { code: 'ir', name: 'Iran' },
  { code: 'se', name: 'Sweden' },
  { code: 'lu', name: 'Luxembourg' },
  { code: 'si', name: 'Slovenia' },
  { code: 'al', name: 'Albania' },
  { code: 'cm', name: 'Cameroon' },
  { code: 'bg', name: 'Bulgaria' },
  { code: 'fi', name: 'Finland' },
  { code: 'es', name: 'Spain' },
  { code: 'de', name: 'Germany' },
]

const doubledRow1 = [...row1Flags, ...row1Flags]
const doubledRow2 = [...row2Flags, ...row2Flags]

export const Home: React.FC = () => {
  const navigate = useNavigate()
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Credit text visibility — appears after welcoming animation (~1.6s)
  const [showCredit, setShowCredit] = useState(false)

  // Registration Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Sliding / Mode State
  const [isQuoteMode, setIsQuoteMode] = useState(false)

  // Contact / Quote Form States
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactService, setContactService] = useState('Air Conditioning & HVAC')
  const [contactMessage, setContactMessage] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const hero = heroRef.current
    const content = contentRef.current

    // Initial states to prevent FOUC
    gsap.set('.hero-image-full', { scale: 1.05, yPercent: 10 })
    gsap.set('.hero-overlay-dark', { yPercent: -100, left: '0%', width: '100%' })
    gsap.set('.hero-tagline', { opacity: 0, y: 20 })
    gsap.set('.hero-heading', { opacity: 0, y: 20 })
    gsap.set('.hero-description', { opacity: 0, y: 20 })
    gsap.set('.hero-actions-container', { opacity: 0, y: 20 })
    gsap.set('.hero-stats', { opacity: 0, y: 20 })

    // Trigger credit text after welcoming animation finishes (~1.5s)
    const creditTimer = setTimeout(() => setShowCredit(true), 1600)

    let ctx = gsap.context(() => {
      CustomEase.create('heroEase', '0.16, 1, 0.3, 1')
      CustomEase.create('textEase', '0.25, 0.46, 0.45, 0.94')

      const tl = gsap.timeline()

      // Phase 1: White page flash hides immediately (0.0s - 0.2s)
      tl.to('.page-flash-overlay', { opacity: 0, display: 'none', duration: 0.3 }, 0)

      // Phase 2: Hero Background Zoom + Pan (0.1s - 0.9s)
      tl.to('.hero-image-full', { scale: 1.0, yPercent: 0, duration: 0.8, ease: 'heroEase' }, 0.1)

      // Dark Overlay Falling Down
      tl.to('.hero-overlay-dark', { yPercent: 0, duration: 0.4, ease: 'power2.out' }, 0.15)

      // Phase 3: Fast Staggered Text Reveals (0.2s - 0.7s)
      tl.to('.hero-tagline', { opacity: 1, y: 0, duration: 0.5, ease: 'textEase' }, 0.2)
      tl.to('.hero-heading', { opacity: 1, y: 0, duration: 0.5, ease: 'textEase' }, 0.3)
      tl.to('.hero-description', { opacity: 1, y: 0, duration: 0.5, ease: 'textEase' }, 0.4)
      tl.to(['.hero-actions-container', '.hero-stats'], { opacity: 1, y: 0, duration: 0.5, ease: 'textEase', stagger: 0.08 }, 0.45)

      // Shift Dark Overlay onto Right Image Column (1.0s - 1.5s) - Welcoming Animation Finish
      tl.to('.hero-overlay-dark', { left: '50%', width: '50%', duration: 0.5, ease: 'power2.inOut' }, 1.0)

      // Phase 6: Ambient subtle floating image effect
      tl.add(() => {
        gsap.to('.hero-image-full', { scale: 1.02, duration: 8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      }, 2.4)

      // Scroll Scrubbing Parallax
      if (hero && content) {
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          }
        })
        scrollTl.to('.hero-image-full', { yPercent: 12, ease: 'none' }, 0)
        scrollTl.to(content, { scale: 0.94, ease: 'none' }, 0)
        scrollTl.to('.scroll-indicator', { opacity: 0, ease: 'none' }, 0)
      }
    }, mainContainerRef)

    return () => {
      ctx.revert()
      clearTimeout(creditTimer)
    }
  }, [])

  const handleSignInClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsQuoteMode(false)
    const formSection = document.getElementById('signin-form-section')
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsQuoteMode(true)
    const formSection = document.getElementById('signin-form-section')
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      alert('KeyStone account created successfully! Please sign in.')
      setName('')
      setEmail('')
      setPhone('')
      setPassword('')
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName || !contactEmail || !contactMessage) {
      setContactError('Please fill in all required fields')
      return
    }

    setContactError(null)
    setContactLoading(true)
    setContactSuccess(false)

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          service: contactService,
          message: contactPhone ? `${contactMessage}\n\nPhone: ${contactPhone}` : contactMessage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit quote enquiry')
      }

      setContactSuccess(true)
      setContactName('')
      setContactEmail('')
      setContactPhone('')
      setContactMessage('')
    } catch (err: any) {
      setContactError(err.message || 'Unable to submit request')
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <div ref={mainContainerRef} className="homepage-light-theme">
      {/* Page Flash Overlay */}
      <div className="fixed inset-0 bg-[#F5F0EA] z-50 pointer-events-none page-flash-overlay" />

      {/* Header / Navbar */}
      <header className="home-header relative">
        <div className="header-container">
          {/* Logo */}
          <Link to="/" className="home-logo">
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 24V11.5C8 9.5 9.5 8 11.5 8H13V24H8Z" fill="currentColor" />
              <path d="M16 24V15C16 13.3 17.3 12 19 12H21.5C22.9 12 24 13.1 24 14.5V24H16Z" fill="currentColor" className="logo-accent-path" />
            </svg>
            <span className="logo-text">
              Key<span className="logo-highlight">Stone</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="home-nav">
            <a href="#services" className="nav-link" onClick={scrollToSection('services')}>Services</a>
            <a href="#how-it-works" className="nav-link" onClick={scrollToSection('how-it-works')}>How It Works</a>
            <a href="#blog" className="nav-link" onClick={scrollToSection('blog')}>Blog</a>
            <a href="#about" className="nav-link" onClick={scrollToSection('about')}>About</a>
            <a href="#testimonials" className="nav-link" onClick={scrollToSection('testimonials')}>Reviews</a>
            <a href="#contact" className="nav-link" onClick={scrollToSection('contact')}>Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="header-actions">
            <Link to="/login" className="btn-signin">Sign in</Link>
            <button className="btn-browse-all">Browse all</button>
          </div>
        </div>


      </header>

      {/* Main Content / Hero Section */}
      <main ref={heroRef} className="home-hero-section relative overflow-hidden" style={{ '--hero-bg-image': `url(${heroHomeImg})` } as React.CSSProperties}>
        <div className="hero-overlay-dark absolute inset-0 bg-black/65 z-10 pointer-events-none" />

        {/* Hero Left Column */}
        <div ref={contentRef} className="hero-content-col z-20">
          <div className="hero-content-inner">
            <span className="hero-tagline">EXPERT HOME CARE SERVICES</span>
            <SplitText
              text="All your home care services, handled by experts"
              className="hero-heading"
              delay={30}
              duration={0.5}
              tag="h1"
            />
            <p className="hero-description">
              Book certified, top-rated professionals for plumbing, AC repair, electrical maintenance, and more—delivered right to your doorstep.
            </p>

            {/* Action Buttons */}
            <div className="hero-actions-container">
              <a href="#signin-form-section" className="hero-btn-primary" onClick={handleSignInClick}>
                Sign-in
              </a>
              <a href="#signin-form-section" className="hero-btn-secondary" onClick={handleQuoteClick}>
                Get a Quote
              </a>
            </div>

            {/* Statistics */}
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">
                  <AnimatedCounter end={10} suffix="K+" />
                </span>
                <span className="stat-label">Happy Clients</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  <AnimatedCounter end={250} suffix="+" />
                </span>
                <span className="stat-label">Certified Experts</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  <AnimatedCounter end={50} suffix="K+" />
                </span>
                <span className="stat-label">Services Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Right Column (Full-height visual) */}
        <div className="hero-visual-col z-20" style={{ position: 'relative' }}>
          <img
            src={heroHomeImg}
            alt="Professional home maintenance technician rendering services"
            className="hero-image-full"
          />

          {/* Credit overlay — appears after welcoming animation */}
          <div className="hero-credit-overlay">
            {showCredit && (
              <div className="hero-credit-block">
                <SplitText
                  text="Keystone Field Management System"
                  className="hero-credit-title"
                  delay={28}
                  duration={0.55}
                  tag="h2"
                  textAlign="center"
                  animationFrom={{ opacity: 0, transform: 'translateY(18px)' }}
                  animationTo={{ opacity: 1, transform: 'translateY(0)' }}
                />
                <p className="hero-credit-byline">
                  <SplitText
                    text="Made by "
                    className="hero-credit-byline-split"
                    delay={30}
                    duration={0.45}
                    tag="span"
                    textAlign="center"
                    animationFrom={{ opacity: 0, transform: 'translateY(10px)' }}
                    animationTo={{ opacity: 1, transform: 'translateY(0)' }}
                  />
                  <a
                    href="https://mohitjorawar.github.io/Mohit-portfolio/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-credit-link"
                  >
                    <SplitText
                      text="Mohit Jorawar"
                      className="hero-credit-byline-split"
                      delay={30}
                      duration={0.45}
                      tag="span"
                      textAlign="center"
                      animationFrom={{ opacity: 0, transform: 'translateY(10px)' }}
                      animationTo={{ opacity: 1, transform: 'translateY(0)' }}
                    />
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>


      </main>

      {/* Services Section */}
      <section id="services" className="home-services-section">
        <div className="services-container">
          <h2 className="services-heading">Our Services</h2>

          {/* Scrolling country flags rows */}
          <div className="flags-scroller-container">
            <div className="marquee-wrapper">
              <div className="marquee-track marquee-row-1">
                {doubledRow1.map((flag, idx) => (
                  <div key={`row1-${idx}`} className="flag-item" title={flag.name}>
                    <img
                      src={`https://flagcdn.com/w40/${flag.code}.png`}
                      alt={flag.name}
                      className="flag-img"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="marquee-wrapper">
              <div className="marquee-track marquee-row-2">
                {doubledRow2.map((flag, idx) => (
                  <div key={`row2-${idx}`} className="flag-item" title={flag.name}>
                    <img
                      src={`https://flagcdn.com/w40/${flag.code}.png`}
                      alt={flag.name}
                      className="flag-img"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Column Service Card Grid */}
          <div className="property-grid">
            <ServiceCard
              image={propertyImg1}
              category="Air Conditioning & HVAC"
              title="Premium AC Repair, Installation & Maintenance"
              rating="4.9 (140+)"
              response="Within 1 Hr"
              warranty="1-Yr Parts"
              price="From ₹699"
            />
            <ServiceCard
              image={propertyImg2}
              category="Residential Plumbing"
              title="Expert Leak Detection, Pipe Repair & Emergency Plumbing"
              rating="4.8 (220+)"
              response="24/7 Service"
              warranty="Guaranteed"
              price="From ₹499"
            />
            <ServiceCard
              image={propertyImg3}
              category="Advanced Drain & Sewer"
              title="Professional Clog Removal, Drain Cleaning & Sewer Line Hydro Jetting"
              rating="4.9 (110+)"
              response="Same Day"
              warranty="Satisfaction"
              price="From ₹999"
            />
            <ServiceCard
              image={propertyImg4}
              category="Electrical Services"
              title="Emergency Wiring, Circuit Breaker & Panel Maintenance"
              rating="4.9 (180+)"
              response="Within 1 Hr"
              warranty="2-Yr Parts"
              price="From ₹599"
            />
            <ServiceCard
              image={propertyImg5}
              category="Smart Home Security"
              title="Smart Lock Installation, Security Cameras & WiFi Setup"
              rating="4.8 (90+)"
              response="Same Day"
              warranty="1-Yr Support"
              price="From ₹1,299"
            />
            <ServiceCard
              image={propertyImg6}
              category="Appliance Repair"
              title="Refrigerator, Washing Machine & Microwave Repair Service"
              rating="4.7 (150+)"
              response="Same Day"
              warranty="90-Day Parts"
              price="From ₹399"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tagline">FOUR SIMPLE STEPS</span>
            <h2 className="section-heading">How KeyStone Works</h2>
            <p className="section-description">
              Experience hassle-free home & facility care from certified experts delivered with digital speed and transparency.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-bg">
                <Wrench size={24} />
              </div>
              <h3 className="step-title">Select Service</h3>
              <p className="step-text">Choose from our catalog of certified HVAC, plumbing, electrical, and facility repair solutions.</p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-bg">
                <Clock size={24} />
              </div>
              <h3 className="step-title">Schedule Visit</h3>
              <p className="step-text">Select your preferred date & instant arrival window with real-time technician tracking.</p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-bg">
                <User size={24} />
              </div>
              <h3 className="step-title">Expert On-Site</h3>
              <p className="step-text">A background-checked, certified specialist arrives fully equipped with OEM replacement parts.</p>
            </div>

            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon-bg">
                <ShieldCheck size={24} />
              </div>
              <h3 className="step-title">100% Guaranteed</h3>
              <p className="step-text">Pay securely after completion backed by our 1-year service warranty & satisfaction guarantee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="section-container about-grid">
          <div className="about-visual-col">
            <div className="about-image-wrapper">
              <img src={propertyImg1} alt="KeyStone certified technicians" className="about-img" />
              <div className="about-badge">
                <span className="badge-stat">250+</span>
                <span className="badge-label">Certified Experts</span>
              </div>
            </div>
          </div>

          <div className="about-content-col">
            <span className="section-tagline">ABOUT KEYSTONE</span>
            <h2 className="section-heading">Redefining Home Maintenance Excellence</h2>
            <p className="section-description">
              KeyStone was founded with a singular mission: to make home care effortless, transparent, and dependable. By combining top-tier field technicians with advanced digital scheduling, we eliminate guesswork.
            </p>

            <div className="about-highlights">
              <div className="highlight-item">
                <ShieldCheck size={20} className="highlight-icon" />
                <div>
                  <h4>100% Background-Checked Technicians</h4>
                  <p>Every specialist undergoes rigorous background screening, skill certification, and safety auditing.</p>
                </div>
              </div>

              <div className="highlight-item">
                <Clock size={20} className="highlight-icon" />
                <div>
                  <h4>Guaranteed 60-Minute Emergency Response</h4>
                  <p>Our rapid-dispatch fleet arrives on-site within 1 hour for urgent plumbing and electrical emergencies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog & Insights Section */}
      <section id="blog" className="blog-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tagline">EXPERT KNOWLEDGE</span>
            <h2 className="section-heading">Blog & Industry Insights</h2>
            <p className="section-description">
              Discover professional maintenance guides, energy-saving tips, and seasonal home care advice.
            </p>
          </div>

          <div className="blog-grid">
            <article className="blog-card">
              <div className="blog-image-wrapper">
                <img src={propertyImg1} alt="AC maintenance guide" className="blog-img" />
                <span className="blog-tag">HVAC & AIR</span>
              </div>
              <div className="blog-content">
                <span className="blog-meta">5 min read • Aug 2026</span>
                <h3 className="blog-title">10 Essential AC Maintenance Tips Before Peak Summer Heat</h3>
                <p className="blog-excerpt">Learn how cleaning coils and replacing air filters can cut cooling bills by up to 25%.</p>
                <a href="#signin-form-section" className="blog-link" onClick={handleQuoteClick}>Read Full Article →</a>
              </div>
            </article>

            <article className="blog-card">
              <div className="blog-image-wrapper">
                <img src={propertyImg2} alt="Plumbing leak guide" className="blog-img" />
                <span className="blog-tag">PLUMBING</span>
              </div>
              <div className="blog-content">
                <span className="blog-meta">4 min read • Jul 2026</span>
                <h3 className="blog-title">How to Spot Hidden Pipe Leaks & Prevent Structural Damage</h3>
                <p className="blog-excerpt">Detect early signs of moisture build-up, pressure drops, and slab leaks before renovation is needed.</p>
                <a href="#signin-form-section" className="blog-link" onClick={handleQuoteClick}>Read Full Article →</a>
              </div>
            </article>

            <article className="blog-card">
              <div className="blog-image-wrapper">
                <img src={propertyImg5} alt="Smart home security guide" className="blog-img" />
                <span className="blog-tag">SMART HOME</span>
              </div>
              <div className="blog-content">
                <span className="blog-meta">6 min read • Jul 2026</span>
                <h3 className="blog-title">Upgrading to Smart Electrical Panels & Security Systems</h3>
                <p className="blog-excerpt">Explore key benefits of automated circuit breakers, smart door locks, and remote surveillance.</p>
                <a href="#signin-form-section" className="blog-link" onClick={handleQuoteClick}>Read Full Article →</a>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tagline">CLIENT REVIEWS</span>
            <h2 className="section-heading">Classic Testimonials</h2>
            <p className="section-description">
              Hear directly from over 10,000+ satisfied homeowners and commercial property owners.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
              </div>
              <p className="testimonial-quote">
                "KeyStone dispatched an AC specialist within 45 minutes on a hot weekend. The technician was polite, highly skilled, and fixed the compressor issue on the spot!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">RS</div>
                <div>
                  <h4 className="author-name">Rahul Sharma</h4>
                  <span className="author-role">Homeowner, Mumbai</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
              </div>
              <p className="testimonial-quote">
                "Managing 14 commercial apartment complexes used to be a maintenance nightmare. KeyStone's digital portal streamlined all our emergency bookings flawlessly."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">PP</div>
                <div>
                  <h4 className="author-name">Priya Patel</h4>
                  <span className="author-role">Facility Director, Bangalore</span>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
                <Star size={16} fill="#ffc107" stroke="#ffc107" />
              </div>
              <p className="testimonial-quote">
                "Transparent upfront pricing with zero hidden fees. The electrical panel replacement was executed cleanly and completed ahead of schedule with full digital invoicing."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">VM</div>
                <div>
                  <h4 className="author-name">Vikram Mehta</h4>
                  <span className="author-role">Villa Owner, Delhi NCR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tagline">GET IN TOUCH</span>
            <h2 className="section-heading">Contact KeyStone Support</h2>
            <p className="section-description">
              Our 24/7 customer care team is here to assist with bookings, emergency service dispatch, and custom quotes.
            </p>
          </div>

          <div className="contact-grid">
            <div className="contact-info-card">
              <div className="info-item">
                <div className="info-icon-bg">
                  <Mail size={22} />
                </div>
                <div>
                  <h4>Email Support</h4>
                  <p>support@keystone.com</p>
                  <span className="info-sub">24/7 Response Time</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-bg">
                  <Clock size={22} />
                </div>
                <div>
                  <h4>Toll-Free Helpline</h4>
                  <p>+91 1800-KEYSTONE</p>
                  <span className="info-sub">Mon - Sun (6:00 AM - 11:00 PM)</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon-bg">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4>Headquarters</h4>
                  <p>KeyStone Tower, Floor 8, Cyber City, Gurgaon</p>
                  <span className="info-sub">Facility Operation Center</span>
                </div>
              </div>
            </div>

            <div className="contact-action-card">
              <h3>Need Immediate Service Assistance?</h3>
              <p>Sign in to your member dashboard or request a custom price estimate instantly.</p>
              <div className="contact-buttons">
                <a href="#signin-form-section" className="hero-btn-primary" onClick={handleSignInClick}>
                  Sign In to Portal
                </a>
                <a href="#signin-form-section" className="hero-btn-secondary" onClick={handleQuoteClick}>
                  Request a Quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Redesigned Connect & Signup Form Section */}
      <section id="signin-form-section" className={`home-connect-section ${isQuoteMode ? 'quote-mode-active' : ''}`}>

        {/* Left Form Column (Dark Side with White Signup Card) */}
        <div className={`connect-form-col left-form-col ${isQuoteMode ? 'mobile-hide' : ''}`}>
          <div className="connect-signup-card">

            {/* Logo Header */}
            <div className="card-brand-logo">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24V11.5C8 9.5 9.5 8 11.5 8H13V24H8Z" fill="currentColor" />
                <path d="M16 24V15C16 13.3 17.3 12 19 12H21.5C22.9 12 24 13.1 24 14.5V24H16Z" fill="currentColor" className="logo-accent-path" />
              </svg>
              <span className="card-brand-text">
                Key<span style={{ fontWeight: 800 }}>Stone</span>
              </span>
            </div>

            {/* Quick Action Icons Grid */}
            <div className="card-category-icons">
              <div className="category-icon-square">
                <Wrench size={18} />
              </div>
              <div className="category-icon-square">
                <ShieldCheck size={18} />
              </div>
              <div className="category-icon-square">
                <Clock size={18} />
              </div>
            </div>

            {/* Sub-header text inside card */}
            <div className="card-header-tagline">
              {!isQuoteMode && <SplitText text="BECOME A MEMBER" delay={15} duration={0.3} />}
            </div>

            {!isQuoteMode && (
              <SplitText
                text="Create your KeyStone account"
                delay={15}
                duration={0.4}
                className="card-header-title"
                tag="h3"
              />
            )}

            {!isQuoteMode && (
              <SplitText
                text="Fill in your details below to become a member and manage your services."
                delay={8}
                duration={0.4}
                className="card-header-subtitle"
                tag="p"
              />
            )}

            {error && (
              <div className="alert alert-danger" style={{ padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <span>{error}</span>
              </div>
            )}

            {/* Signup inputs form */}
            <form onSubmit={handleRegisterSubmit} className="signup-form">
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">
                  {!isQuoteMode ? <SplitText text="Full Name" delay={10} duration={0.3} /> : "Full Name"}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="register-name"
                    type="text"
                    className="form-input-light"
                    placeholder="enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required={!isQuoteMode}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">
                  {!isQuoteMode ? <SplitText text="Email Address" delay={10} duration={0.3} /> : "Email Address"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="register-email"
                    type="email"
                    className="form-input-light"
                    placeholder="enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required={!isQuoteMode}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-phone">
                  {!isQuoteMode ? <SplitText text="Phone Number" delay={10} duration={0.3} /> : "Phone Number"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="register-phone"
                    type="tel"
                    className="form-input-light"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" htmlFor="register-password">
                  {!isQuoteMode ? <SplitText text="Password" delay={10} duration={0.3} /> : "Password"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="register-password"
                    type="password"
                    className="form-input-light"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required={!isQuoteMode}
                  />
                </div>
              </div>

              {/* Redesigned Button Actions matching download/learn card */}
              <div className="card-action-buttons">
                <button type="submit" className="connect-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="connect-btn-login"
                  disabled={loading}
                >
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Form Column (Dark Side with White Contact Card) */}
        <div className={`connect-form-col right-form-col ${!isQuoteMode ? 'mobile-hide' : ''}`}>
          <div className="connect-signup-card">

            {/* Logo Header */}
            <div className="card-brand-logo">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 24V11.5C8 9.5 9.5 8 11.5 8H13V24H8Z" fill="currentColor" />
                <path d="M16 24V15C16 13.3 17.3 12 19 12H21.5C22.9 12 24 13.1 24 14.5V24H16Z" fill="currentColor" className="logo-accent-path" />
              </svg>
              <span className="card-brand-text">
                Key<span style={{ fontWeight: 800 }}>Stone</span>
              </span>
            </div>

            {/* Quick Action Icons Grid */}
            <div className="card-category-icons">
              <div className="category-icon-square">
                <ClipboardList size={18} />
              </div>
              <div className="category-icon-square">
                <ShieldCheck size={18} />
              </div>
              <div className="category-icon-square">
                <Wrench size={18} />
              </div>
            </div>

            {/* Sub-header text inside card */}
            <div className="card-header-tagline">
              {isQuoteMode && <SplitText text="REQUEST A QUOTE" delay={15} duration={0.3} />}
            </div>

            {isQuoteMode && (
              <SplitText
                text="Get a service estimate"
                delay={15}
                duration={0.4}
                className="card-header-title"
                tag="h3"
              />
            )}

            {isQuoteMode && (
              <SplitText
                text="Provide your service needs below and our team will get back to you shortly."
                delay={8}
                duration={0.4}
                className="card-header-subtitle"
                tag="p"
              />
            )}

            {contactSuccess && (
              <div className="alert alert-success" style={{ padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem', color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
                <span>Your request has been sent! We will contact you soon.</span>
              </div>
            )}

            {contactError && (
              <div className="alert alert-danger" style={{ padding: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <span>{contactError}</span>
              </div>
            )}

            {/* Contact inputs form */}
            <form onSubmit={handleContactSubmit} className="signup-form">
              <div className="form-group">
                <label className="form-label" htmlFor="contact-name">
                  {isQuoteMode ? <SplitText text="Full Name" delay={10} duration={0.3} /> : "Full Name"}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="contact-name"
                    type="text"
                    className="form-input-light"
                    placeholder="enter your name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={contactLoading}
                    required={isQuoteMode}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-email">
                  {isQuoteMode ? <SplitText text="Email Address" delay={10} duration={0.3} /> : "Email Address"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="contact-email"
                    type="email"
                    className="form-input-light"
                    placeholder="enter your email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={contactLoading}
                    required={isQuoteMode}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-phone">
                  {isQuoteMode ? <SplitText text="Phone Number" delay={10} duration={0.3} /> : "Phone Number"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <input
                    id="contact-phone"
                    type="tel"
                    className="form-input-light"
                    placeholder="Enter your phone number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={contactLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="contact-service">
                  {isQuoteMode ? <SplitText text="Service Type" delay={10} duration={0.3} /> : "Service Type"}
                </label>
                <div style={{ position: 'relative' }}>
                  <Wrench
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-home-light)',
                      zIndex: 2,
                    }}
                  />
                  <select
                    id="contact-service"
                    className="form-input-light"
                    style={{ paddingLeft: '2.5rem', appearance: 'none', background: '#fff', cursor: 'pointer' }}
                    value={contactService}
                    onChange={(e) => setContactService(e.target.value)}
                    disabled={contactLoading}
                  >
                    <option value="Air Conditioning & HVAC">Air Conditioning & HVAC</option>
                    <option value="Residential Plumbing">Residential Plumbing</option>
                    <option value="Advanced Drain & Sewer">Advanced Drain & Sewer</option>
                    <option value="Electrical Services">Electrical Services</option>
                    <option value="Smart Home Security">Smart Home Security</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                    <option value="Other Maintenance">Other Maintenance</option>
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-home-light)',
                    fontSize: '0.8rem'
                  }}>▼</div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label" htmlFor="contact-message">
                  {isQuoteMode ? <SplitText text="Service Requirements" delay={10} duration={0.3} /> : "Service Requirements"}
                </label>
                <div style={{ position: 'relative' }}>
                  <MessageSquare
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '12px',
                      color: 'var(--text-home-light)',
                    }}
                  />
                  <textarea
                    id="contact-message"
                    className="form-input-light"
                    style={{ paddingLeft: '2.5rem', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Describe what services you need..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    disabled={contactLoading}
                    required={isQuoteMode}
                  />
                </div>
              </div>

              <div className="card-action-buttons">
                <button type="submit" className="connect-btn-submit" disabled={contactLoading}>
                  {contactLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                      Sending Request...
                    </>
                  ) : (
                    'Request Free Quote'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuoteMode(false)}
                  className="connect-btn-login"
                  disabled={contactLoading}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sliding Text Overlay Panel (Light Gray-Blue Background) */}
        <div className="connect-overlay-panel">
          <div className="connect-right-content">
            {!isQuoteMode ? (
              <>
                <TextType
                  text="CONNECT WITH US"
                  className="connect-tagline"
                  showCursor={false}
                  key="su-tag"
                />
                <TextType
                  text="Connecting you with home care experts has never been so easy"
                  as="h2"
                  className="connect-heading"
                  showCursor={false}
                  typingSpeed={20}
                  key="su-head"
                />
                <TextType
                  text="Book certified, top-rated professionals for plumbing, HVAC, electrical, and maintenance services. Track work orders, view logs, and manage your sites directly from our web portal or download our mobile apps."
                  as="p"
                  className="connect-description"
                  showCursor={false}
                  typingSpeed={10}
                  key="su-desc"
                />
                <div className="hero-actions-container" style={{ margin: '1.75rem 0 0 0' }}>
                  <button
                    onClick={() => setIsQuoteMode(true)}
                    className="btn-hexagon-left"
                  >
                    Get a Quote
                  </button>
                </div>
              </>
            ) : (
              <>
                <TextType
                  text="GET A QUOTE"
                  className="connect-tagline"
                  showCursor={false}
                  key="q-tag"
                />
                <TextType
                  text="Request a custom quote for your home care services"
                  as="h2"
                  className="connect-heading"
                  showCursor={false}
                  typingSpeed={20}
                  key="q-head"
                />
                <TextType
                  text="Tell us about your requirements, and our certified experts will get in touch with you. We guarantee transparent pricing, high-quality workmanship, and same-day response for emergencies."
                  as="p"
                  className="connect-description"
                  showCursor={false}
                  typingSpeed={10}
                  key="q-desc"
                />
                <div className="hero-actions-container" style={{ margin: '1.75rem 0 0 0' }}>
                  <button
                    onClick={() => setIsQuoteMode(false)}
                    className="btn-hexagon-right"
                  >
                    Sign In / Register
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </section>

      {/* Luxury Footer Section */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <Link to="/" className="home-logo">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 24V11.5C8 9.5 9.5 8 11.5 8H13V24H8Z" fill="currentColor" />
                  <path d="M16 24V15C16 13.3 17.3 12 19 12H21.5C22.9 12 24 13.1 24 14.5V24H16Z" fill="currentColor" className="logo-accent-path" />
                </svg>
                <span className="logo-text">
                  Key<span className="logo-highlight">Stone</span>
                </span>
              </Link>
              <p className="footer-tagline">
                Premium field management & doorstep service portal for homeowners and commercial facilities.
              </p>
            </div>

            <div className="footer-nav-cols">
              <div className="footer-col">
                <h4>Navigation</h4>
                <a href="#services" onClick={scrollToSection('services')}>Services</a>
                <a href="#how-it-works" onClick={scrollToSection('how-it-works')}>How It Works</a>
                <a href="#blog" onClick={scrollToSection('blog')}>Blog</a>
                <a href="#about" onClick={scrollToSection('about')}>About Us</a>
                <a href="#testimonials" onClick={scrollToSection('testimonials')}>Reviews</a>
                <a href="#contact" onClick={scrollToSection('contact')}>Contact Support</a>
              </div>

              <div className="footer-col">
                <h4>Services</h4>
                <a href="#services" onClick={scrollToSection('services')}>Air Conditioning & HVAC</a>
                <a href="#services" onClick={scrollToSection('services')}>Residential Plumbing</a>
                <a href="#services" onClick={scrollToSection('services')}>Drain & Sewer Jetting</a>
                <a href="#services" onClick={scrollToSection('services')}>Electrical Maintenance</a>
                <a href="#services" onClick={scrollToSection('services')}>Smart Home Security</a>
              </div>

              <div className="footer-col">
                <h4>Contact Info</h4>
                <p>+91 1800-KEYSTONE</p>
                <p>support@keystone.com</p>
                <p>Cyber City, Gurgaon, India</p>
              </div>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} KeyStone Facilities Inc. All rights reserved.
            </p>
            <p className="footer-developer">
              Project made by{' '}
              <a
                href="https://mohitjorawar.github.io/Mohit-portfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="developer-link"
              >
                Mohit Jorawar
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
