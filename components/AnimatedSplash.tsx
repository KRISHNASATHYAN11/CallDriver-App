import React, { useEffect } from 'react';
import { Animated, Image, StyleSheet, View, Easing } from 'react-native';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const scaleValue = new Animated.Value(0.2);
  const opacityValue = new Animated.Value(0);

  useEffect(() => {
   
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1, 
        duration: 1000, 
        easing: Easing.out(Easing.bezier(0.25, 0.1, 0.25, 1)), // Smooth curve
        useNativeDriver: true, 
      }),
      Animated.timing(opacityValue, {
        toValue: 1, 
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/splash-icon.png')} 
        style={[
          styles.logo,
          {
            opacity: opacityValue,
            transform: [{ scale: scaleValue }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400, 
    height: 400,
  },
});