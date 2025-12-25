import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Gift, MapPin, CreditCard } from 'lucide-react';
import loyaltyGiftImage from '../../assets/images/loyalty-hero-new.png';

export const LoyaltyIntro: React.FC = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Всегда под рукой",
      description: "Электронная карта в вашем смартфоне (Apple Wallet / Google Pay). Больше никакого пластика."
    },
    {
      icon: Gift,
      title: "500 бонусов в подарок",
      description: "Дарим 500 приветственных бонусов сразу после регистрации. 1 бонус = 1 рубль."
    },
    {
      icon: MapPin,
      title: "Единая сеть",
      description: "Накапливайте и списывайте бонусы во всех заведениях сети Medisson Lounge."
    },
    {
      icon: CreditCard,
      title: "Накопительная система",
      description: "Ваш процент кэшбэка растет вместе с общей суммой заказов. От 5% до 15%."
    }
  ];

  return (
    <section className="py-12 md:py-24 bg-zinc-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-16">
          
          {/* Text Content */}
          <div className="lg:w-1/2 z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-6xl font-serif font-bold mb-4 md:mb-6"
            >
              Система <span className="text-amber-500">лояльности</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-xl text-white/70 mb-8 md:mb-12 leading-relaxed"
            >
              Мы ценим каждого гостя и хотим, чтобы ваш отдых был не только приятным, но и выгодным. 
              Присоединяйтесь к нашей программе лояльности и получайте привилегии с первого визита.
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex flex-col gap-2 md:gap-3"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <feature.icon size={20} className="md:w-6 md:h-6" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold">{feature.title}</h3>
                  <p className="text-xs md:text-sm text-white/60">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Image Content */}
          <div className="lg:w-1/2 relative flex items-center justify-center min-h-[300px] md:min-h-[450px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-10 w-full flex items-center justify-center"
            >
              <img 
                src={loyaltyGiftImage}
                alt="Loyalty Program Gifts" 
                className="w-full max-w-[650px] h-auto object-contain drop-shadow-[0_25px_50px_rgba(245,158,11,0.3)]"
              />
            </motion.div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

        </div>
      </div>
    </section>
  );
};
