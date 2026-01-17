import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Pressable,
  FlatList,
} from 'react-native';
import colors from '../../constants/colors';

const {width} = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Busca Audioguías',
    description:
      'Busca audioguías en tu destino a visitar. Ejemplo: La Candelaria, Bogotá.',
    emoji: '🔍',
  },
  {
    id: '2',
    title: 'Compra tu Guía',
    description:
      'Compra tu audioguía y accede a contenido exclusivo narrado por expertos.',
    emoji: '🛒',
  },
  {
    id: '3',
    title: 'Camina y Escucha',
    description:
      'Sal a caminar con tus audífonos puestos y Vaggage te irá mostrando y guiando por los lugares interesantes.',
    emoji: '🎧',
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({onFinish}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const updateCurrentSlideIndex = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const goToNextSlide = () => {
    const nextSlideIndex = currentSlideIndex + 1;
    if (nextSlideIndex !== SLIDES.length) {
      const offset = nextSlideIndex * width;
      flatListRef?.current?.scrollToOffset({offset});
      setCurrentSlideIndex(nextSlideIndex);
    } else {
      onFinish();
    }
  };

  const skip = () => {
    onFinish();
  };

  const Slide = ({item}: {item: (typeof SLIDES)[0]}) => {
    return (
      <View style={styles.slide}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          onMomentumScrollEnd={updateCurrentSlideIndex}
          contentContainerStyle={{height: width}} // Adjust height if needed, but flex works better usually
          showsHorizontalScrollIndicator={false}
          horizontal
          data={SLIDES}
          pagingEnabled
          renderItem={({item}) => <Slide item={item} />}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentSlideIndex === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {currentSlideIndex < SLIDES.length - 1 ? (
            <>
              <Pressable onPress={skip}>
                <Text style={styles.skipButtonText}>Saltar</Text>
              </Pressable>
              <Pressable style={styles.nextButton} onPress={goToNextSlide}>
                <Text style={styles.nextButtonText}>Siguiente</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.startButton} onPress={goToNextSlide}>
              <Text style={styles.startButtonText}>Empezar</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.green.textSecondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: colors.green.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 150,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  indicator: {
    height: 8,
    width: 8,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: colors.green.textSecondary,
    width: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: colors.green.textSecondary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: colors.green.textSecondary,
    paddingVertical: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Onboarding;
