import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../logo-icon.png';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    items: [
      { q: 'What is PasaBuy App?', a: 'PasaBuy App is an errand-sharing app that connects users who are going out with those who need something bought. Buyers earn commission by purchasing items for others while they\'re already out.' },
      { q: 'Who can use the PasaBuy App?', a: 'PasaBuy App is designed for users who want to buy something through pasabuys. Anyone with a Google account can sign up and start using the app immediately.' },
      { q: 'Is PasaBuy App free to use?', a: 'Yes! Currently, PasaBuy App is free to use during the trial run, Membership fees will start to be charged after this period . During the trial period, the only cost involved is the 15% commission added on top of the item price, which goes directly to the buyer as their earning.' },
    ]
  },
  {
    category: 'For Buyers',
    items: [
      { q: 'How do I post an entry?', a: 'Tap the "I\'m going out!" button on the home screen, fill in where you\'re going, what you can buy, and how long you\'ll be out, then tap "Post Entry."' },
      { q: 'Can I post multiple entries at the same time?', a: 'Yes, you can post multiple entries. However we encourage you to only post when you\'re actually going out to maintain trust in the community.' },
      { q: 'How do I accept or reject a request?', a: 'Go to your entry, scroll down to see the requests, and tap "Accept" or "Reject" on each request card.' },
      { q: 'What happens when my entry expires?', a: 'Your entry will automatically end and no new requests can be submitted. Existing accepted requests and their chats will remain accessible until completed.' },
      { q: 'Can I end my run early?', a: 'Yes! Tap your entry and click the "End My Run" button at any time to close your entry early.' },
      { q: 'How many requests can I accept per entry?', a: 'There is no limit. You can accept as many requests as you can handle during your run.' },
    ]
  },
  {
    category: 'For Pasabuyers',
    items: [
      { q: 'How do I request a pasabuy?', a: 'Browse the home feed, tap on an active entry, tap "Request a Pasabuy", fill in the item name and details, then submit your request.' },
      { q: 'Can I request from multiple entries?', a: 'Yes! You can submit one request per entry. So if there are multiple active entries, you can request from each one.' },
      { q: 'What happens after my request is accepted?', a: 'You\'ll be able to open the chat with the buyer to coordinate. The buyer will then set the item price and send you a payment request.' },
      { q: 'How do I pay for my order?', a: 'Once the buyer sets the price, you\'ll receive the total amount to pay in the chat. Send the exact amount via GCash to the number provided, then upload your receipt for verification.' },
      { q: 'What if I want to cancel my request?', a: 'Currently, you can contact the buyer through chat to coordinate a cancellation. A formal cancel button will be added in a future update.' },
    ]
  },
  {
    category: 'Payment',
    items: [
      { q: 'How does payment work?', a: 'Once the buyer sets the price, you\'ll receive the total amount to pay in the chat. Send the exact amount via GCash to the number provided, then upload your receipt for verification.' },
      { q: 'What GCash number do I send payment to?', a: 'The GCash number will be provided in the payment request message inside the chat. Make sure to send to the exact number shown.' },
      { q: 'What happens after I send payment?', a: 'Upload your GCash receipt in the chat. Once your payment is verified, the buyer will be notified to purchase and deliver your item.' },
      { q: 'How is my payment kept safe?', a: 'PasaBuy App uses an escrow-based payment system to ensure the safety of all transactions. This means that your payment is held and verified by the admin before it is released to the buyer. This ensures that the buyer only receives payment after successfully delivering your item, protecting both parties from fraud or disputes.' },
    ]
  },
  {
    category: 'Earnings & Commission',
    items: [
      { q: 'How much commission do buyers earn?', a: 'Buyers earn 15% of the item price as commission. For example, if an item costs ₱100, you earn ₱15 on top of the item price.' },
      { q: 'When will my earnings be transferred?', a: 'After you upload proof of delivery and the admin verifies it, your earnings will be transferred to your registered GCash number.' },
      { q: 'How do I receive my earnings?', a: 'Earnings are transferred directly to the GCash number you registered in your profile. Make sure your GCash number is correct and up to date.' },
    ]
  },
  {
    category: 'Ratings & Badges',
    items: [
      { q: 'How does the rating system work?', a: 'After a transaction is completed, both the buyer and pasabuyer can rate each other from 1 to 5 stars with an optional comment.' },
      { q: 'When can I rate a transaction?', a: 'The rate button appears in the chat after the transaction is marked as completed.' },
      { q: 'How do I earn badges?', a: 'Badges are automatically awarded based on your activity in the app. Visit your profile to see which badges you\'ve earned.' },
      { q: 'What badges are available?', a: 'First Pasabuy — Complete your first transaction. On a Roll — Complete 5 transactions. Top Pasabuyer — Complete 10 transactions. Highly Rated — Achieve a 4.5+ average rating with at least 3 ratings. Active Buyer — Post 5 entries. Big Earner — Earn ₱500+ in commissions.' },
    ]
  },
  {
    category: 'Disputes & Issues',
    items: [
      { q: 'What if there\'s a problem with my order?', a: 'You can raise a dispute through the chat page. The admin will review and resolve the issue within operating hours.' },
      { q: 'How do I raise a dispute?', a: 'In the chat, tap the "Raise a Dispute" button and describe your concern. The admin will be notified immediately.' },
      { q: 'How long does dispute resolution take?', a: 'Disputes are reviewed and resolved within operating hours of 8AM to 10PM. We aim to resolve all disputes as quickly as possible.' },
      { q: 'What if the buyer doesn\'t deliver my item?', a: 'Raise a dispute through the chat. The admin will review the proof of delivery and take appropriate action including possible account suspension of the buyer.' },
      { q: 'What if the pasabuyer doesn\'t pay?', a: 'The buyer is not required to purchase the item until payment is verified. If payment is not received within 15 minutes, the buyer has the option to cancel the request.' },
    ]
  },
  {
    category: 'Account & Safety',
    items: [
      { q: 'Is my GCash number safe?', a: 'Your GCash number is only used for receiving your earnings and is not shared publicly. Only the admin can see it for payment purposes.' },
      { q: 'What happens if I get a strike?', a: 'Strikes are given for violations of PasaBuy\'s rules. After 3 strikes your account will be automatically suspended.' },
      { q: 'Why was my account suspended?', a: 'Accounts are suspended for violations such as providing fake information, not fulfilling accepted requests, or receiving 3 strikes. Contact the admin for appeals.' },
      { q: 'How do I update my GCash number?', a: 'Go to your Profile page and tap "Edit" next to your GCash number to update it.' },
    ]
  },
  {
    category: 'App Usage',
    items: [
      { q: 'How do I contact the admin?', a: 'You can reach the admin through the Helpdesk feature in the app or by raising a dispute if it\'s transaction-related.' },
      { q: 'What are the operating hours for support?', a: 'Support is available daily from 8AM to 10PM.' },
      { q: 'How do I report a suspicious user?', a: 'Raise a dispute or contact the admin through the Helpdesk with the user\'s name and details of your concern.' },
    ]
  },
  {
    category: 'Entry & Timing',
    items: [
      { q: 'How long can an entry stay active?', a: 'You can set your entry to be active for 30 minutes, 1 hour, 2 hours, or 3 hours when posting.' },
      { q: 'What happens to my pending requests if an entry expires?', a: 'Pending requests that haven\'t been accepted will no longer be actionable. Already accepted requests and their chats remain accessible.' },
      { q: 'Can the buyer extend their entry time?', a: 'Currently, entries cannot be extended once posted. You can end your current entry and post a new one with a longer duration.' },
    ]
  },
  {
    category: 'Leaderboard',
    items: [
      { q: 'How is the leaderboard calculated?', a: 'The Top Earners leaderboard ranks buyers by total commission earned. The Top Pasabuyers leaderboard ranks users by number of completed transactions.' },
      { q: 'How often is the leaderboard updated?', a: 'The leaderboard updates in real time every time you visit the page.' },
    ]
  },
  {
    category: 'Notifications',
    items: [
      { q: 'Will I be notified when my request is accepted?', a: 'Currently notifications are shown inside the app through the chat and request status updates. Push notifications will be added in a future update.' },
      { q: 'Will I be notified when payment is verified?', a: 'Yes! A system message will appear in the chat immediately when your payment is verified.' },
    ]
  },
  {
    category: 'Chat',
    items: [
      { q: 'Can I send photos in the chat?', a: 'Currently only proof of delivery photos and GCash receipts can be uploaded. General photo sharing in chat will be added in a future update.' },
      { q: 'What happens to the chat after the transaction is completed?', a: 'The chat remains accessible for both parties to view even after the transaction is completed. You can access it through the My Requests page.' },
    ]
  },
  {
    category: 'Campus Specific',
    items: [
      { q: 'Is PasaBuy App only for students?', a: 'PasaBuy App was initially designed primarily for campus use but anyone with a Google account can sign up and use the app.' },
      { q: 'What areas or locations are covered?', a: 'PasaBuy App can be used anywhere! Buyers can post entries for any location they\'re heading to.' },
      { q: 'Can I use PasaBuy App off campus?', a: 'Yes! While PasaBuy App was designed with campus life in mind, you can use it anywhere as long as there are active entries in your area.' },
    ]
  },
];

export default function FAQ({ user }) {
  const navigate = useNavigate();
  const [openItem, setOpenItem] = useState(null);
  const [search, setSearch] = useState('');

  const filteredFaqs = faqs.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #6B0000 0%, #8B0000 45%, #1A3B20 100%)',
      display: 'flex', flexDirection: 'column',
      maxWidth: '480px', margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ padding: '52px 24px 24px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,229,102,0.1) 0%, transparent 65%)',
          pointerEvents: 'none'
        }}/>

        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '20px'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white', padding: '8px 16px',
              borderRadius: '100px', fontSize: '13px',
              fontWeight: '600', border: '1px solid rgba(255,255,255,0.12)'
            }}
          >← Back</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--yellow)', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src={logoIcon} alt="PasaBuy"
                style={{ width: '22px', height: '22px', borderRadius: '6px' }}/>
            </div>
            <span style={{
              fontFamily: 'Raleway, sans-serif',
              color: 'var(--yellow)', fontSize: '17px', fontWeight: '800'
            }}>PasaBuy App</span>
          </div>
        </div>

        <h1 style={{
          fontFamily: 'Raleway, sans-serif',
          color: 'white', fontSize: '26px',
          fontWeight: '800', letterSpacing: '-0.3px'
        }}>FAQs</h1>
        <p style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '13px', marginTop: '4px'
        }}>Frequently asked questions</p>
      </div>

      {/* White card */}
      <div style={{
        flex: 1, background: 'white',
        borderRadius: '32px 32px 0 0',
        padding: '20px 20px 100px',
        boxShadow: '0 -8px 48px rgba(0,0,0,0.18)'
      }}>
        <div style={{
          width: '32px', height: '4px',
          background: '#EDE5E5', borderRadius: '4px',
          margin: '0 auto 20px'
        }}/>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: '#F5F0F0', borderRadius: '14px',
          padding: '10px 14px', marginBottom: '20px',
          border: '1.5px solid transparent',
          transition: 'all 0.2s ease'
        }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = 'var(--maroon)';
            e.currentTarget.style.background = 'white';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = '#F5F0F0';
          }}
        >
          <span style={{ color: 'var(--text-soft)', fontSize: '16px' }}>🔍</span>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent',
              fontSize: '13px', fontWeight: '500',
              color: 'var(--text)'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: '#EDE5E5', color: '#888',
                width: '18px', height: '18px',
                borderRadius: '50%', fontSize: '10px',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}
            >✕</button>
          )}
        </div>

        {/* FAQ sections */}
        {filteredFaqs.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            background: '#FFF8F8', borderRadius: '20px',
            border: '1px dashed #FECACA'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <p style={{
              fontFamily: 'Raleway, sans-serif',
              fontSize: '16px', fontWeight: '800',
              color: 'var(--text)', marginBottom: '6px'
            }}>No results found</p>
            <p style={{ color: 'var(--text-soft)', fontSize: '13px' }}>
              Try searching with different keywords
            </p>
          </div>
        )}

        {filteredFaqs.map((section, si) => (
          <div key={si} style={{ marginBottom: '20px' }}>
            <p style={{
              fontSize: '11px', fontWeight: '800',
              color: 'var(--maroon)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '10px'
            }}>{section.category}</p>

            {section.items.map((item, ii) => {
              const key = `${si}-${ii}`;
              const isOpen = openItem === key;
              return (
                <div key={ii} style={{
                  background: isOpen ? '#FFF8F8' : 'white',
                  borderRadius: '14px',
                  border: `1px solid ${isOpen ? '#FECACA' : '#F0E8E8'}`,
                  marginBottom: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}>
                  <button
                    onClick={() => setOpenItem(isOpen ? null : key)}
                    style={{
                      width: '100%', padding: '14px 16px',
                      background: 'none',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <p style={{
                      fontSize: '13px', fontWeight: '700',
                      color: isOpen ? 'var(--maroon)' : 'var(--text)',
                      flex: 1, lineHeight: '1.5'
                    }}>{item.q}</p>
                    <span style={{
                      color: isOpen ? 'var(--maroon)' : '#B0A0A0',
                      flexShrink: 0
                    }}>
                      {isOpen
                        ? <ChevronUp size={16} strokeWidth={2}/>
                        : <ChevronDown size={16} strokeWidth={2}/>
                      }
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 16px 14px',
                      borderTop: '1px solid #F0E8E8'
                    }}>
                      <p style={{
                        fontSize: '13px', color: 'var(--text-soft)',
                        lineHeight: '1.7', fontWeight: '500',
                        paddingTop: '12px'
                      }}>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}