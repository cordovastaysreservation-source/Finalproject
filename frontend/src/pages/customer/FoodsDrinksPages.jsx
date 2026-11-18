import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cachedGet } from '../../api/client';
import { Button, FloatingInput, FloatingSelect } from '../../components/UI';
import { ResortCard } from '../../components/CustomerCards';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import { useBookingFlow } from '../../context/BookingFlowContext';
import { formatCurrency } from '../../styles/tokens';

// Rich curated fallback menu items with real high-res food & drink photos
const CURATED_MENU = {
  bundle: [
    {
      id: 'b1',
      name: 'Cordova Seafood & Lechon Feast Platter',
      category: 'Bundle Highlight',
      price: 1400,
      image: 'https://www.themealdb.com/images/media/meals/1548772327.jpg',
      desc: 'Grilled tuna panga, buttered garlic shrimp, crispy pork belly & native sauces.',
    },
    {
      id: 'b2',
      name: 'Island Grilled Chicken & Bam-i Guisado',
      category: 'Main Dish',
      price: 950,
      image: 'https://www.themealdb.com/images/media/meals/yxsurp1511304301.jpg',
      desc: 'Cebuano-style pancit bam-i with charcoal-grilled chicken inasal & garlic rice basket.',
    },
    {
      id: 'b3',
      name: 'Tropical Fruit & Leche Flan Platter',
      category: 'Dessert',
      price: 650,
      image: 'https://www.themealdb.com/images/media/meals/sywswr1511383814.jpg',
      desc: 'Chilled Cebu sweet mangoes, watermelon, pineapple & creamy caramel leche flan.',
    },
    {
      id: 'b4',
      name: '2 Pitchers Fresh Mango & Buko Pandan Shake',
      category: 'Drinks Included',
      price: 800,
      image: 'https://www.thecocktaildb.com/images/media/drink/vdp2do1487603520.jpg',
      desc: 'Ice-blended fresh ripe mango smoothie and young coconut pandan cooler (good for 4–6 guests).',
    },
  ],
  foods: [
    {
      id: 'f1',
      name: 'Baked Scallops & Buttered Garlic Shrimp',
      category: 'Cordova Specialty',
      price: 950,
      image: 'https://www.themealdb.com/images/media/meals/1529445434.jpg',
      desc: 'Freshly harvested Mactan-Cordova scallops baked with cheese and garlic butter.',
    },
    {
      id: 'f2',
      name: 'Crispy Cebu Lechon Belly Roll',
      category: 'House Favorite',
      price: 1100,
      image: 'https://www.themealdb.com/images/media/meals/h3ijwo1581013377.jpg',
      desc: 'Slow-roasted lechon belly stuffed with lemongrass, scallions, and Cebu spices.',
    },
    {
      id: 'f3',
      name: 'Grilled Tuna Panga & Calamares',
      category: 'Seafood Grill',
      price: 900,
      image: 'https://www.themealdb.com/images/media/meals/uvuyxu1503067369.jpg',
      desc: 'Charcoal-grilled yellowfin tuna jaw with crispy golden squid rings & dipping sauce.',
    },
    {
      id: 'f4',
      name: 'Platter of Garlic Fried Rice & Pancit Canton',
      category: 'Family Sharing',
      price: 850,
      image: 'https://www.themealdb.com/images/media/meals/1529444830.jpg',
      desc: 'Generous family serving of fragrant garlic rice and stir-fried egg noodles.',
    },
  ],
  drinks: [
    {
      id: 'd1',
      name: 'Fresh Cebu Mango Smoothie Pitcher',
      category: 'Tropical Shake',
      price: 950,
      image: 'https://www.thecocktaildb.com/images/media/drink/vdp2do1487603520.jpg',
      desc: 'Pure sweet Cebu carabao mangoes blended with crushed ice and milk.',
    },
    {
      id: 'd2',
      name: 'Chilled Buko Pandan & Coconut Cooler',
      category: 'Island Refreshment',
      price: 950,
      image: 'https://www.thecocktaildb.com/images/media/drink/xtuyqv1472669026.jpg',
      desc: 'Fresh young coconut strips with pandan jelly and sweetened cream over ice.',
    },
    {
      id: 'd3',
      name: 'Watermelon & Berry Sunset Mocktail Pitcher',
      category: 'Poolside Mocktail',
      price: 950,
      image: 'https://www.thecocktaildb.com/images/media/drink/uqwuyp1454514391.jpg',
      desc: 'Refreshing poolside mocktail crafted with fresh watermelon, citrus, and mint.',
    },
    {
      id: 'd4',
      name: 'Calamansi Honey & Lemongrass Iced Tea Tower',
      category: 'Signature Cooler',
      price: 950,
      image: 'https://www.thecocktaildb.com/images/media/drink/trvwpu1441245568.jpg',
      desc: 'House-brewed lemongrass iced tea infused with fresh calamansi and wild honey.',
    },
  ],
};

/**
 * 1. Foods and Drinks Main Resort Directory Page (Page 48)
 */
export function FoodsAndDrinksMainPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [resorts, setResorts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResorts = (q = '') => {
    setLoading(true);
    cachedGet('/resorts', { params: q ? { search: q } : {} })
      .then((data) => setResorts(data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResorts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResorts(search);
  };

  return (
    <div>
      <h1 className="page-title">Foods and Drinks</h1>
      <p className="page-subtitle">
        Select a resort to browse bundle feasts, local seafood dishes, and tropical drinks.
      </p>

      <form
        onSubmit={handleSearch}
        className="cs-card"
        style={{
          padding: 16,
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <FloatingInput
          label="Search resorts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or location"
        />
        <FloatingInput
          label="Check-in"
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
        <FloatingInput
          label="Check-out"
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
        />
        <FloatingSelect
          label="Guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          options={[
            { value: 1, label: '1 guest' },
            { value: 2, label: '2 guests' },
            { value: 3, label: '3 guests' },
            { value: 4, label: '4 guests' },
          ]}
        />
        <Button type="submit" style={{ height: 48, padding: '0 26px' }}>
          Enjoy!
        </Button>
      </form>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
        {resorts.length} {resorts.length === 1 ? 'resort' : 'resorts'} to explore
      </h2>

      {loading ? (
        <div className="cs-card">Loading resorts...</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 20,
          }}
        >
          {resorts.map((resort) => (
            <ResortCard
              key={resort.id}
              resort={resort}
              showViewLink={true}
              onClick={() => navigate(`/foods-drinks/${resort.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 2. Resort Foods and Drinks 5-Tile Gallery Page (Pages 38–46)
 */
export function ResortFoodsDrinksGalleryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cachedGet(`/resorts/${slug}/foods-drinks`)
      .then((data) => setCatalog(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="cs-card">Loading foods and drinks...</div>;
  if (!catalog) return <div className="cs-card">Resort not found.</div>;

  const categories = [
    {
      key: 'bundle',
      title: 'Bundle Foods and Drinks',
      price: 3800,
      badge: 'Best Value • Good for 4–6 Guests',
      desc: 'Complete poolside boodle feast with grilled seafood, Cebu lechon belly, rice, desserts, and 2 pitchers of tropical shakes.',
      img: 'https://www.themealdb.com/images/media/meals/1548772327.jpg',
    },
    {
      key: 'foods',
      title: 'Foods Package',
      price: 3800,
      badge: 'Chef Signature Platter',
      desc: 'Baked Cordova scallops, buttered garlic shrimp, crispy lechon roll, grilled tuna panga, and family pancit canton.',
      img: 'https://www.themealdb.com/images/media/meals/1529445434.jpg',
    },
    {
      key: 'drinks',
      title: 'Drinks Package',
      price: 3800,
      badge: 'Poolside Refreshments',
      desc: 'Fresh Cebu mango smoothies, chilled buko pandan coolers, watermelon sunset mocktails, and calamansi iced tea.',
      img: 'https://www.thecocktaildb.com/images/media/drink/vdp2do1487603520.jpg',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Link to="/foods-drinks" style={{ fontSize: 13, fontWeight: 700, color: '#0A7F82' }}>
          ← Back to Resorts
        </Link>
      </div>

      <h1 className="page-title">{catalog.resort.name}</h1>
      <p className="page-subtitle">Bundle Foods and Drinks order</p>

      {/* 5-Tile Bento Gallery with Real Food & Drink Photos */}
      <div
        className="cs-card"
        style={{
          padding: 18,
          display: 'grid',
          gridTemplateColumns: '1.35fr 1fr',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <ImagePlaceholder
          src="https://www.themealdb.com/images/media/meals/1548772327.jpg"
          label="Bundle Foods and Drinks"
          height="268px"
          borderRadius="10px"
          showCaptionOverlay
          onClick={() => navigate(`/foods-drinks/${slug}/bundle`)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 14,
          }}
        >
          <ImagePlaceholder
            src="https://www.themealdb.com/images/media/meals/1529445434.jpg"
            label="Foods"
            height="127px"
            borderRadius="10px"
            showCaptionOverlay
            onClick={() => navigate(`/foods-drinks/${slug}/foods`)}
          />
          <ImagePlaceholder
            src="https://www.themealdb.com/images/media/meals/uvuyxu1503067369.jpg"
            label="Foods"
            height="127px"
            borderRadius="10px"
            showCaptionOverlay
            onClick={() => navigate(`/foods-drinks/${slug}/foods`)}
          />
          <ImagePlaceholder
            src="https://www.thecocktaildb.com/images/media/drink/vdp2do1487603520.jpg"
            label="Drinks"
            height="127px"
            borderRadius="10px"
            showCaptionOverlay
            onClick={() => navigate(`/foods-drinks/${slug}/drinks`)}
          />
          <ImagePlaceholder
            src="https://www.thecocktaildb.com/images/media/drink/uqwuyp1454514391.jpg"
            label="Drinks"
            height="127px"
            borderRadius="10px"
            showCaptionOverlay
            onClick={() => navigate(`/foods-drinks/${slug}/drinks`)}
          />
        </div>
      </div>

      {/* Interactive Category Cards */}
      <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
        Choose a Dining Package
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 18,
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.key}
            className="cs-card"
            style={{
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <ImagePlaceholder
                src={cat.img}
                label={cat.title}
                height="150px"
                borderRadius="10px"
                onClick={() => navigate(`/foods-drinks/${slug}/${cat.key}`)}
              />
              <div
                style={{
                  display: 'inline-block',
                  background: '#DAF3EE',
                  color: '#0A7F82',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 999,
                  marginTop: 12,
                  marginBottom: 6,
                }}
              >
                {cat.badge}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
                {cat.title}
              </h3>
              <p style={{ fontSize: 12.5, color: '#6B8585' }}>{cat.desc}</p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #EDF3F2',
                paddingTop: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0F3F40' }}>
                  {formatCurrency(cat.price)}
                </div>
                <div style={{ fontSize: 11, color: '#6B8585' }}>Package price</div>
              </div>
              <Button onClick={() => navigate(`/foods-drinks/${slug}/${cat.key}`)}>
                View & Order →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3. Single Item Detail Page: Bundle Foods and Drinks / Foods / Drinks (Pages 11–37)
 * Enhanced with Live Free Food/Drink API (TheMealDB & TheCocktailDB) + Dish Selection!
 */
export function FoodDrinkItemDetailPage() {
  const { slug, itemType } = useParams();
  const navigate = useNavigate();
  const { updateFlow } = useBookingFlow();

  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiDishes, setApiDishes] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState({});

  const defaultDishes = CURATED_MENU[itemType] || CURATED_MENU.bundle;

  useEffect(() => {
    setLoading(true);
    cachedGet(`/resorts/${slug}/foods-drinks`)
      .then((data) => setCatalog(data))
      .finally(() => setLoading(false));

    // Pre-select default dishes with quantity 1
    const initSel = {};
    defaultDishes.forEach((d) => {
      initSel[d.id] = 1;
    });
    setSelectedDishes(initSel);

    // Fetch live bonus dishes/drinks from free TheMealDB / TheCocktailDB API
    const freeApiUrl =
      itemType === 'drinks'
        ? 'https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=Non_Alcoholic'
        : 'https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood';

    fetch(freeApiUrl)
      .then((r) => r.json())
      .then((json) => {
        const raw = (json.meals || json.drinks || []).slice(0, 4);
        const mapped = raw.map((entry, idx) => ({
          id: `api_${idx}`,
          name: entry.strMeal || entry.strDrink,
          category: itemType === 'drinks' ? 'Live CocktailDB Special' : 'Live MealDB Seafood',
          price: 950,
          image: entry.strMealThumb || entry.strDrinkThumb,
          desc:
            itemType === 'drinks'
              ? 'Freshly prepared tropical non-alcoholic resort beverage.'
              : 'Chef-prepared coastal seafood dish served fresh to your table or room.',
        }));
        if (mapped.length > 0) {
          setApiDishes(mapped);
        }
      })
      .catch(() => {
        // Offline or blocked: curated menu is already active
      });
  }, [slug, itemType]);

  if (loading) return <div className="cs-card">Loading menu...</div>;
  if (!catalog) return <div className="cs-card">Resort not found.</div>;

  const item = catalog.items?.[itemType] || catalog.items?.bundle;
  const allMenuDishes = [...defaultDishes, ...apiDishes];

  const heroImage =
    itemType === 'drinks'
      ? 'https://www.thecocktaildb.com/images/media/drink/vdp2do1487603520.jpg'
      : itemType === 'foods'
      ? 'https://www.themealdb.com/images/media/meals/1529445434.jpg'
      : 'https://www.themealdb.com/images/media/meals/1548772327.jpg';

  const handleQtyChange = (id, delta) => {
    setSelectedDishes((prev) => {
      const nextQty = Math.max(0, (prev[id] || 0) + delta);
      const updated = { ...prev, [id]: nextQty };
      return updated;
    });
  };

  const chosenList = allMenuDishes
    .filter((d) => (selectedDishes[d.id] || 0) > 0)
    .map((d) => ({
      ...d,
      qty: selectedDishes[d.id],
    }));

  const handleBuy = () => {
    const customLines =
      chosenList.length > 0
        ? chosenList.map((d) => `${d.qty}× ${d.name}`)
        : item.lines;

    updateFlow({
      flowType: 'food',
      resortId: catalog.resort.id,
      resortSlug: catalog.resort.slug,
      resortName: catalog.resort.name,
      foodType: item.type,
      foodLabel: item.label,
      foodPriceLabel: item.price_label,
      foodConfirmLabel: item.confirm_label,
      foodTotal: 3800,
      foodCustomLines: customLines,
    });
    navigate(`/foods-drinks/${slug}/${itemType}/price`);
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <Link to={`/foods-drinks/${slug}`} style={{ fontSize: 13, fontWeight: 700, color: '#0A7F82' }}>
          ← Back to {catalog.resort.name} Gallery
        </Link>
      </div>

      <h1 className="page-title">{catalog.resort.name}</h1>
      <p className="page-subtitle">Bundle Foods and Drinks order</p>

      <div className="cs-card" style={{ padding: 22, marginBottom: 24 }}>
        <ImagePlaceholder
          src={heroImage}
          label={item.label}
          height="280px"
          borderRadius="12px"
          showCaptionOverlay
        />

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F3F40' }}>{item.label}</h2>
            <p style={{ fontSize: 13.5, color: '#6B8585' }}>
              Customize your included dishes below • Package rate:{' '}
              <strong style={{ color: '#0A7F82' }}>{formatCurrency(item.price)}</strong>
            </p>
          </div>
          <Button onClick={handleBuy} style={{ minWidth: 180, height: 46 }}>
            Buy ({formatCurrency(item.price)})
          </Button>
        </div>
      </div>

      {/* Included & Live API Menu Dishes Grid */}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F3F40', marginBottom: 14 }}>
        Included Menu & Chef Specials (Select Items)
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
          gap: 16,
        }}
      >
        {allMenuDishes.map((dish) => {
          const qty = selectedDishes[dish.id] || 0;
          return (
            <div
              key={dish.id}
              className="cs-card"
              style={{
                padding: 14,
                border: qty > 0 ? '1.8px solid #0A7F82' : '1px solid #DCE7E5',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div>
                <ImagePlaceholder
                  src={dish.image}
                  label={dish.name}
                  height="140px"
                  borderRadius="8px"
                />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0A7F82',
                    marginTop: 10,
                    marginBottom: 2,
                  }}
                >
                  {dish.category}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F3F40', marginBottom: 4 }}>
                  {dish.name}
                </div>
                <p style={{ fontSize: 12, color: '#6B8585' }}>{dish.desc}</p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #EDF3F2',
                  paddingTop: 10,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0F3F40' }}>
                  {qty > 0 ? `Included (${qty}×)` : 'Add to Bundle'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(dish.id, -1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid #CFE0DD',
                      background: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    −
                  </button>
                  <span style={{ fontSize: 13.5, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQtyChange(dish.id, 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid #0A7F82',
                      background: '#DAF3EE',
                      color: '#0A7F82',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 4. Foods and Drinks – Payment Price Page (Pages 8–10)
 */
export function FoodDrinkPaymentPricePage() {
  const { slug, itemType } = useParams();
  const navigate = useNavigate();
  const { flow, updateFlow } = useBookingFlow();

  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cachedGet(`/resorts/${slug}/foods-drinks`)
      .then((data) => setCatalog(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="cs-card">Loading price details...</div>;
  if (!catalog) return <div className="cs-card">Resort not found.</div>;

  const item = catalog.items?.[itemType] || catalog.items?.bundle;
  const displayLines = flow.foodCustomLines?.length ? flow.foodCustomLines : item.lines;

  const handlePay = () => {
    updateFlow({
      flowType: 'food',
      resortId: catalog.resort.id,
      resortSlug: catalog.resort.slug,
      resortName: catalog.resort.name,
      foodType: item.type,
      foodLabel: item.label,
      foodPriceLabel: item.price_label,
      foodConfirmLabel: item.confirm_label,
      foodTotal: item.price,
      foodDates: '20–22 Oct 2026',
    });
    navigate('/booking/payment');
  };

  return (
    <div>
      <h1 className="page-title">Foods and Drinks</h1>
      <p className="page-subtitle">Bundle Foods and Drinks order — {catalog.resort.name}</p>

      <div style={{ maxWidth: 820 }}>
        <div className="cs-card" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F3F40', marginBottom: 16 }}>
            Payment Price
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 15,
              fontWeight: 700,
              color: '#0F3F40',
              marginBottom: 10,
            }}
          >
            <span>{item.price_label}</span>
            <span>{formatCurrency(item.price)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingLeft: 4,
              marginBottom: 16,
              color: '#3E5959',
              fontSize: 13,
            }}
          >
            {(displayLines || []).map((lineText, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, color: '#0A7F82' }}>✓</span>
                <span>{lineText}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid #E2ECEA',
              paddingTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#0F3F40' }}>
              Estimated total
            </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#0A7F82' }}>
              {formatCurrency(item.price)}
            </span>
          </div>

          <div style={{ fontSize: 11.5, color: '#6B8585', marginTop: 4 }}>
            Sample amount only
          </div>
        </div>

        <Button fullWidth onClick={handlePay} style={{ height: 46 }}>
          Pay
        </Button>
      </div>
    </div>
  );
}
