import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Recycle, Search, MapPin, Plus, Leaf, Package, Truck, X, ImagePlus, Upload, CheckCircle2, Trash2, RotateCcw, ClipboardList, Menu } from 'lucide-react'

const initialListings = [
  { id: 1, title: 'Plastic bottles', category: 'Plastic', quantity: '5 kg', location: 'Dhanmondi, Dhaka', price: 'Negotiable', image: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d9a?w=700', status: 'Available' },
  { id: 2, title: 'Cardboard boxes', category: 'Paper', quantity: '12 kg', location: 'Mirpur, Dhaka', price: 'Free collection', image: 'https://images.unsplash.com/photo-1607166452427-7e4477079cb9?w=700', status: 'Available' },
  { id: 3, title: 'Aluminium cans', category: 'Metal', quantity: '3 kg', location: 'Uttara, Dhaka', price: 'Negotiable', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=700', status: 'Available' },
]
const categories = ['All materials', 'Plastic', 'Paper', 'Metal', 'Glass']
const STORAGE_KEY = 'porishkarbd-listings'
const ROLE_KEY = 'porishkarbd-demo-role'
const emptyForm = { title: '', category: 'Plastic', quantity: '', location: '', price: 'Free collection', image: '' }

function loadListings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    console.error('Could not load saved listings:', error)
  }
  return initialListings
}

function App() {
  const [listings, setListings] = useState(loadListings)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All materials')
  const [selectedListing, setSelectedListing] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [storageError, setStorageError] = useState('')
  const [role, setRole] = useState(() => {
    try { return localStorage.getItem(ROLE_KEY) === 'collector' ? 'collector' : 'resident' } catch { return 'resident' }
  })

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return listings.filter((listing) =>
      (activeCategory === 'All materials' || listing.category === activeCategory) &&
      [listing.title, listing.location, listing.category].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    )
  }, [listings, searchQuery, activeCategory])

  const availableCount = listings.filter((listing) => (listing.status || 'Available') === 'Available').length
  const requestedCount = listings.filter((listing) => listing.status === 'Requested').length
  // Only listings created in this demo belong to the resident account.
  const myListings = listings.filter((listing) => listing.owner === 'demo-resident')
  const myRequests = listings.filter((listing) => listing.requestedBy === 'Demo collector')

  function commitListings(updated, message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setStorageError('')
    } catch (error) {
      console.error('Could not save change:', error)
      setStorageError('Could not save changes. Please free some browser storage.')
      return false
    }
    setListings(updated)
    setSelectedListing(null)
    setSuccessMessage(message)
    return true
  }

  function deleteListing(id) {
    const target = listings.find((item) => item.id === id)
    if (role !== 'resident' || target?.owner !== 'demo-resident') return
    if (!window.confirm(`Delete your listing “${target.title}”?`)) return
    commitListings(listings.filter((item) => item.id !== id), 'Listing deleted.')
  }

  function cancelRequest(id) {
    const target = listings.find((item) => item.id === id)
    if (role !== 'collector' || target?.requestedBy !== 'Demo collector' || target.status !== 'Requested') return
    commitListings(listings.map((item) => item.id === id
      ? { ...item, status: 'Available', requestedBy: null }
      : item), 'Collection request cancelled. The listing is available again.')
  }

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
      setStorageError('')
    } catch (error) {
      console.error('Could not save listings:', error)
      setStorageError('Browser storage is full. Your latest changes may not survive a refresh. Try a smaller image.')
    }
  }, [listings])

  useEffect(() => {
    try { localStorage.setItem(ROLE_KEY, role) } catch (error) { console.error('Could not save role:', error) }
  }, [role])

  useEffect(() => {
    if (!showCreateForm && !selectedListing) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowCreateForm(false)
        setSelectedListing(null)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow }
  }, [showCreateForm, selectedListing])

  function requestCollection(id) {
    if (role !== 'collector') return
    const target = listings.find((listing) => listing.id === id)
    if (!target || (target.status || 'Available') !== 'Available') return
    const updated = listings.map((listing) => listing.id === id
      ? { ...listing, status: 'Requested', requestedBy: 'Demo collector' }
      : listing)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      setStorageError('')
    } catch (error) {
      console.error('Could not save collection request:', error)
      setStorageError('Could not save request. Check browser storage space.')
      return
    }
    setListings(updated)
    setSelectedListing(null)
    setSuccessMessage('Collection requested! The listing is now marked Requested.')
  }

  function switchRole(nextRole) {
    setRole(nextRole)
    setSelectedListing(null)
    setMobileMenuOpen(false)
    setSuccessMessage(nextRole === 'collector' ? 'Collector mode enabled.' : 'Resident mode enabled.')
  }

  function openCreateForm() {
    setFormError('')
    setShowCreateForm(true)
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setFormError('')
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Please upload a JPG, PNG or WebP image.')
      event.target.value = ''
      return
    }
    // Keep the image small because Base64 data is saved in localStorage.
    if (file.size > 500 * 1024) {
      setFormError('Please choose an image smaller than 500 KB for this browser-only demo.')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((previous) => ({ ...previous, image: reader.result }))
        setFormError('')
      }
    }
    reader.onerror = () => setFormError('Could not read the image. Please try again.')
    reader.readAsDataURL(file)
  }

  function handleCreateListing(event) {
    event.preventDefault()
    const title = formData.title.trim()
    const location = formData.location.trim()
    const quantity = Number(formData.quantity)
    if (!title || !location || !formData.quantity) {
      setFormError('Please complete all required fields.')
      return
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('Quantity must be greater than zero.')
      return
    }
    if (!formData.image) {
      setFormError('Please upload a photo of your material.')
      return
    }
    const newListing = {
      id: crypto.randomUUID(), title, category: formData.category,
      quantity: `${quantity} kg`, location, price: formData.price,
      image: formData.image, status: 'Available', owner: 'demo-resident',
    }
    // Check capacity before updating the UI, so success means the listing was saved.
    const nextListings = [newListing, ...listings]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextListings))
      setStorageError('')
    } catch (error) {
      console.error('Could not save listing:', error)
      setFormError('Not enough browser storage. Try a smaller image or remove old demo listings.')
      return
    }
    setListings(nextListings)
    setFormData({ ...emptyForm })
    setShowCreateForm(false)
    setActiveCategory('All materials')
    setSearchQuery('')
    setSuccessMessage('Your waste listing has been published!')
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F5EB] text-[#202820]">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 md:px-12">
        <a href="#top" className="shrink-0 text-xl font-black tracking-tight text-[#123D2B] sm:text-2xl">porishkar<span className="text-[#83A83B]">BD.</span></a>
        <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a href="#discover" className="text-[#123D2B]">Discover</a>
          <a href="#activity" className="text-gray-500 hover:text-[#123D2B]">My Activity</a>
          <a href="#how-it-works" className="text-gray-500 hover:text-[#123D2B]">How it works</a>
          <a href="#about" className="text-gray-500 hover:text-[#123D2B]">About us</a>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-full border border-[#D4DFC7] bg-white p-1" aria-label="Demo user role">
            {['resident', 'collector'].map((item) => (
              <button key={item} type="button" onClick={() => switchRole(item)} aria-pressed={role === item}
                className={`rounded-full px-3 py-2 text-xs font-bold capitalize transition sm:px-4 ${role === item ? 'bg-[#C7F36B] text-[#123D2B]' : 'text-gray-500 hover:text-[#123D2B]'}`}>
                {item}
              </button>
            ))}
          </div>
          <a href="#activity" className="hidden rounded-full border border-[#D4DFC7] bg-white px-3 py-3 text-xs font-bold text-[#123D2B] sm:inline-flex sm:px-4">My Activity</a>
          {role === 'resident' && <button type="button" onClick={openCreateForm} className="flex items-center gap-2 rounded-full bg-[#123D2B] px-4 py-3 text-sm font-bold text-white hover:bg-[#20553D]">
            <Plus size={17} /> Post waste
          </button>}
          <button type="button" className="rounded-full border border-[#D4DFC7] bg-white p-3 text-[#123D2B] md:hidden" aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button>
        </div>
        {mobileMenuOpen && <div id="mobile-navigation" className="flex w-full flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm md:hidden">
          {[['Discover', '#discover'], ['My Activity', '#activity'], ['How it works', '#how-it-works'], ['About us', '#about']].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-[#123D2B] hover:bg-[#F1F7E9]">{label}</a>)}
        </div>}
      </nav>

      <main id="top" className="mx-auto max-w-7xl px-4 sm:px-6 md:px-12">
        <section className="relative mt-4 overflow-hidden rounded-[2rem] bg-[#123D2B] px-6 py-12 text-white sm:mt-8 md:px-16 md:py-20">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-[#C7F36B]"><Recycle size={15} /> THE FUTURE IS CIRCULAR</div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-7xl">Waste isn't waste.<span className="block text-[#C7F36B]">It's a resource.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/70 md:text-lg">Turn your recyclable waste into something valuable. Connect with collectors and make your community cleaner.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#discover" className="inline-flex items-center justify-center gap-3 rounded-full bg-[#C7F36B] px-6 py-4 text-sm font-bold sm:px-7 sm:text-base text-[#123D2B] hover:bg-[#d8ff83]">Explore materials <ArrowRight size={18} /></a>
              <a href="#how-it-works" className="inline-flex items-center rounded-full border border-white/30 px-6 py-4 text-sm font-bold sm:px-7 sm:text-base hover:bg-white/10">How it works</a>
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-24 -right-20 hidden h-96 w-96 items-center justify-center rounded-full border border-white/10 md:flex"><div className="flex h-72 w-72 items-center justify-center rounded-full border border-white/10"><div className="flex h-48 w-48 items-center justify-center rounded-full bg-[#C7F36B] text-[#123D2B]"><Recycle size={100} strokeWidth={1.2} /></div></div></div>
          <div className="absolute right-8 top-8 hidden rounded-2xl bg-[#C7F36B] p-4 text-[#123D2B] lg:block"><Leaf size={30} /></div>
        </section>

        <section className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-3 sm:gap-4 sm:py-8" aria-label="Demo listing statistics">
          {[
            { icon: Package, value: listings.length, label: 'Demo listings' },
            { icon: Truck, value: availableCount, label: 'Available materials' },
            { icon: Recycle, value: requestedCount, label: 'Collection requests' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-5"><item.icon className="mb-4 text-[#65913D]" size={23} /><h3 className="text-2xl font-black text-[#123D2B]">{item.value}</h3><p className="mt-1 text-sm text-gray-500">{item.label}</p></div>
          ))}
        </section>

        <section id="discover" className="scroll-mt-6 pb-20 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#719447]">GIVE WASTE A SECOND LIFE</p><h2 className="text-3xl font-black tracking-tight text-[#123D2B] md:text-4xl">Discover materials</h2><p className="mt-2 text-sm text-gray-500">Find recyclable materials available near you.</p></div>
            <button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('All materials') }} className="flex items-center gap-2 text-sm font-bold text-[#123D2B]">View all <ArrowRight size={17} /></button>
          </div>
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#E7E5D9] bg-white px-5 py-4"><Search size={20} className="text-gray-400" /><input type="search" aria-label="Search materials" placeholder="Search plastic, paper, metal or location..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" /></div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2" aria-label="Material categories">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category} className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold transition ${activeCategory === category ? 'bg-[#123D2B] text-white' : 'border border-[#E7E5D9] bg-white text-gray-600 hover:border-[#123D2B]'}`}>{category}</button>
            ))}
          </div>
          <p className="mt-5 text-sm font-medium text-[#46664E]">
            {role === 'collector' ? 'Collector mode: browse materials and request a pickup.' : 'Resident mode: post recyclable materials for collectors.'}
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <article key={listing.id} className="group overflow-hidden rounded-3xl bg-white transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-56 overflow-hidden bg-[#EAEDE2]"><img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute left-4 top-4 rounded-full bg-[#C7F36B] px-4 py-2 text-xs font-bold text-[#123D2B]">{listing.category}</span><span className="absolute right-4 top-4 rounded-full bg-white px-3 py-2 text-xs font-bold text-[#123D2B]">{listing.status || 'Available'}</span></div>
                <div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-black text-[#123D2B]">{listing.title}</h3><span className="whitespace-nowrap text-sm font-bold text-[#719447]">{listing.quantity}</span></div><p className="mt-3 flex items-center gap-2 text-sm text-gray-500"><MapPin size={16} /> {listing.location}</p><div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4"><span className="text-xs font-semibold text-gray-500">{listing.price}</span><button type="button" onClick={() => setSelectedListing(listing)} className="flex items-center gap-2 text-sm font-bold text-[#123D2B]">View details <ArrowRight size={16} /></button></div></div>
              </article>
            ))}
          </div>
          {filteredListings.length === 0 && <div className="mt-8 rounded-3xl bg-white p-12 text-center"><Search size={40} className="mx-auto text-gray-400" /><h3 className="mt-4 text-xl font-black text-[#123D2B]">No materials found</h3><p className="mt-2 text-sm text-gray-500">Try another search or select a different category.</p><button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('All materials') }} className="mt-5 rounded-full bg-[#123D2B] px-6 py-3 font-bold text-white">Clear filters</button></div>}
        </section>

        {/* Step 5: Activity dashboard. This is a single-browser demo, not authenticated accounts. */}
        <section id="activity" className="scroll-mt-8 pb-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#719447]">YOUR DEMO WORKSPACE</p>
              <h2 className="mt-2 text-3xl font-black text-[#123D2B] md:text-4xl">My Activity</h2>
              <p className="mt-2 text-sm text-gray-500">{role === 'resident' ? 'Manage your posted recyclable materials.' : 'Track and manage your collection requests.'}</p>
            </div>
            <span className="rounded-full bg-[#C7F36B] px-4 py-2 text-sm font-bold capitalize text-[#123D2B]">{role} mode</span>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(role === 'resident' ? [
              { label: 'My listings', value: myListings.length },
              { label: 'Available', value: myListings.filter((item) => (item.status || 'Available') === 'Available').length },
              { label: 'Requested', value: myListings.filter((item) => item.status === 'Requested').length },
            ] : [
              { label: 'My requests', value: myRequests.length },
              { label: 'Pending pickup', value: myRequests.filter((item) => item.status === 'Requested').length },
              { label: 'Materials listed', value: listings.length },
            ]).map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white p-5">
                <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black text-[#123D2B]">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-3xl bg-white p-5 sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList className="text-[#719447]" size={23} />
              <h3 className="text-xl font-black text-[#123D2B]">{role === 'resident' ? 'My waste listings' : 'My collection requests'}</h3>
            </div>
            {(role === 'resident' ? myListings : myRequests).length === 0 ? (
              <div className="rounded-2xl bg-[#F7F5EB] px-5 py-12 text-center">
                <Package size={36} className="mx-auto text-[#719447]" />
                <p className="mt-3 font-bold text-[#123D2B]">{role === 'resident' ? 'You have not posted anything yet.' : 'You have not requested a collection yet.'}</p>
                <p className="mt-1 text-sm text-gray-500">{role === 'resident' ? 'Create a listing to see it here.' : 'Switch to Discover and request an available material.'}</p>
                {role === 'resident' ? (
                  <button type="button" onClick={openCreateForm} className="mt-4 rounded-full bg-[#123D2B] px-5 py-3 text-sm font-bold text-white">Post waste</button>
                ) : (
                  <a href="#discover" className="mt-4 inline-block rounded-full bg-[#123D2B] px-5 py-3 text-sm font-bold text-white">Browse materials</a>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {(role === 'resident' ? myListings : myRequests).map((listing) => (
                  <div key={listing.id} className="flex min-w-0 flex-col gap-4 rounded-2xl border border-[#E7E5D9] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <img src={listing.image} alt={listing.title} className="h-16 w-16 shrink-0 rounded-xl bg-[#EAEDE2] object-cover" />
                      <div className="min-w-0">
                        <h4 className="truncate font-black text-[#123D2B]">{listing.title}</h4>
                        <p className="mt-1 text-xs text-gray-500">{listing.quantity} · {listing.location}</p>
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${listing.status === 'Requested' ? 'bg-amber-100 text-amber-800' : 'bg-[#E6F5D2] text-[#123D2B]'}`}>
                          {listing.status || 'Available'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setSelectedListing(listing)} className="rounded-full border border-[#D4DFC7] px-4 py-2 text-xs font-bold text-[#123D2B]">Details</button>
                      {role === 'resident' ? (
                        <button type="button" onClick={() => deleteListing(listing.id)} className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 size={14} /> Delete</button>
                      ) : (
                        <button type="button" onClick={() => cancelRequest(listing.id)} className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"><RotateCcw size={14} /> Cancel request</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-8 pb-16"><h2 className="mb-6 text-3xl font-black text-[#123D2B]">How it works</h2><div className="grid gap-4 md:grid-cols-3">{[{ n: '01', title: 'Post materials', desc: 'Residents upload a photo and describe their recyclable waste.' }, { n: '02', title: 'Explore listings', desc: 'Collectors discover materials by category and pickup location.' }, { n: '03', title: 'Arrange collection', desc: 'Collectors can request pickup and track a listing’s request status.' }].map((step) => <div key={step.n} className="rounded-2xl bg-white p-6"><span className="text-xl font-black text-[#719447]">{step.n}</span><h3 className="mt-3 text-lg font-black text-[#123D2B]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{step.desc}</p></div>)}</div></section>
      </main>
      
      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-12">
        <div className="rounded-2xl border border-[#DDE6D4] bg-[#EDF3E8] p-4 text-sm text-[#46664E]">
          <strong>Demo Notice:</strong> This is a frontend prototype.
          Listings and collection requests are saved locally in your
          browser and are not shared across users or devices.
        </div>
      </section>


      <footer id="about" className="bg-[#123D2B] px-6 py-10 text-center text-white"><h2 className="text-2xl font-black">porishkar<span className="text-[#C7F36B]">BD.</span></h2><p className="mt-3 text-sm text-white/60">A cleaner Bangladesh starts with us.</p><p className="mt-2 text-xs text-white/40">Frontend prototype · Sample data · Browser-only storage</p></footer>

      {storageError && <div role="alert" className="fixed left-4 right-4 top-4 z-[60] rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-800 shadow-lg">{storageError}</div>}
      {successMessage && <div role="status" className="fixed bottom-4 left-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl sm:bottom-6 sm:left-auto sm:right-6 bg-[#123D2B] p-4 text-white shadow-xl"><CheckCircle2 size={22} className="text-[#C7F36B]" /><span className="text-sm font-semibold">{successMessage}</span><button type="button" aria-label="Dismiss message" onClick={() => setSuccessMessage('')} className="ml-2"><X size={18} /></button></div>}

      {selectedListing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedListing(null)}><div role="dialog" aria-modal="true" aria-labelledby="listing-dialog-title" className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close listing details" onClick={() => setSelectedListing(null)} className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow"><X size={20} /></button><img src={selectedListing.image} alt={selectedListing.title} className="h-56 w-full object-cover" /><div className="p-7"><span className="rounded-full bg-[#C7F36B] px-4 py-2 text-xs font-bold text-[#123D2B]">{selectedListing.category}</span><h2 id="listing-dialog-title" className="mt-5 text-3xl font-black text-[#123D2B]">{selectedListing.title}</h2><div className="mt-5 space-y-3 text-sm text-gray-600"><p><strong>Quantity:</strong> {selectedListing.quantity}</p><p><strong>Pickup location:</strong> {selectedListing.location}</p><p><strong>Collection terms:</strong> {selectedListing.price}</p><p><strong>Status:</strong> {selectedListing.status || 'Available'}</p></div>{role === 'collector' ? (
                <button type="button" disabled={(selectedListing.status || 'Available') !== 'Available'} onClick={() => requestCollection(selectedListing.id)}
                  className="mt-7 w-full rounded-full bg-[#123D2B] px-6 py-4 font-bold text-white hover:bg-[#20553D] disabled:cursor-not-allowed disabled:opacity-50">
                  {(selectedListing.status || 'Available') === 'Available' ? 'Request Collection' : 'Collection Already Requested'}
                </button>
              ) : (
                <p className="mt-7 rounded-xl bg-[#F1F7E9] p-4 text-sm font-medium text-[#123D2B]">Switch to Collector Mode to request this material.</p>
              )}</div></div></div>}

      {showCreateForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreateForm(false)}><div role="dialog" aria-modal="true" aria-labelledby="create-listing-title" className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#F7F5EB] p-6 shadow-2xl md:p-8" onClick={(event) => event.stopPropagation()}><button type="button" aria-label="Close form" onClick={() => setShowCreateForm(false)} className="absolute right-5 top-5 rounded-full bg-white p-2"><X size={20} /></button><div className="mb-7 pr-10"><p className="text-xs font-bold uppercase tracking-widest text-[#719447]">GIVE MATERIALS A SECOND LIFE</p><h2 id="create-listing-title" className="mt-2 text-3xl font-black text-[#123D2B]">Post your waste.</h2><p className="mt-2 text-sm text-gray-500">Share recyclable materials with collectors in your area.</p></div>
        <form onSubmit={handleCreateListing} className="space-y-5">
          <div><label htmlFor="waste-image" className="mb-2 block text-sm font-bold text-[#123D2B]">Material photo *</label><label htmlFor="waste-image" className="flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#B8C8AD] bg-white p-4 text-center">{formData.image ? <img src={formData.image} alt="Selected material preview" className="max-h-48 w-full rounded-xl object-contain" /> : <><ImagePlus size={35} className="text-[#719447]" /><span className="mt-3 text-sm font-bold text-[#123D2B]">Click to upload an image</span><span className="mt-1 text-xs text-gray-500">JPG, PNG or WebP · Max 500 KB</span></>}</label><input id="waste-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="sr-only" /></div>
          <div><label htmlFor="waste-title" className="mb-2 block text-sm font-bold text-[#123D2B]">Material name *</label><input id="waste-title" name="title" type="text" maxLength={80} value={formData.title} onChange={handleInputChange} placeholder="e.g. Used plastic bottles" className="w-full rounded-xl border border-[#E7E5D9] bg-white px-4 py-3 outline-none focus:border-[#719447]" required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="waste-category" className="mb-2 block text-sm font-bold text-[#123D2B]">Category *</label><select id="waste-category" name="category" value={formData.category} onChange={handleInputChange} className="w-full rounded-xl border border-[#E7E5D9] bg-white px-4 py-3 outline-none focus:border-[#719447]">{categories.slice(1).map((category) => <option key={category} value={category}>{category}</option>)}</select></div><div><label htmlFor="waste-quantity" className="mb-2 block text-sm font-bold text-[#123D2B]">Quantity (kg) *</label><input id="waste-quantity" name="quantity" type="number" min="0.1" step="0.1" value={formData.quantity} onChange={handleInputChange} placeholder="e.g. 5" className="w-full rounded-xl border border-[#E7E5D9] bg-white px-4 py-3 outline-none focus:border-[#719447]" required /></div></div>
          <div><label htmlFor="waste-location" className="mb-2 block text-sm font-bold text-[#123D2B]">Pickup location *</label><input id="waste-location" name="location" type="text" maxLength={120} value={formData.location} onChange={handleInputChange} placeholder="e.g. Badda, Dhaka" className="w-full rounded-xl border border-[#E7E5D9] bg-white px-4 py-3 outline-none focus:border-[#719447]" required /></div>
          <div><label htmlFor="waste-price" className="mb-2 block text-sm font-bold text-[#123D2B]">Collection terms</label><select id="waste-price" name="price" value={formData.price} onChange={handleInputChange} className="w-full rounded-xl border border-[#E7E5D9] bg-white px-4 py-3 outline-none focus:border-[#719447]"><option value="Free collection">Free collection</option><option value="Negotiable">Negotiable</option></select></div>
          {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{formError}</p>}
          <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#123D2B] px-6 py-4 font-bold text-white transition hover:bg-[#20553D]"><Upload size={18} /> Publish listing</button>
        </form>
      </div></div>}
    </div>
  )
}

export default App
