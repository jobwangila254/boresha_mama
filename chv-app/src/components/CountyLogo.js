import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function CountyLogo({ size = 80, showTagline = true }) {
  const imgSize = size * 0.8;

  return (
    <View style={styles.wrapper}>
      <Image
        source={require('../assets/images/transnzoia-logo.webp')}
        style={{ width: imgSize * 1.5, height: imgSize * 0.75, resizeMode: 'contain' }}
      />
      <Text style={[styles.countyName, { fontSize: size * 0.13 }]}>TRANS-NZOIA COUNTY</Text>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: size * 0.11 }]}>Unity in Diversity</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  countyName: {
    color: '#004d26',
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
    textAlign: 'center',
  },
  tagline: {
    color: '#888',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginTop: 1,
  },
});
