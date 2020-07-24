import React, { useState, useEffect, useRef } from 'react';
import { Text, Image, View, StyleSheet, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import * as SMS from 'expo-sms';
import * as Cellular from 'expo-cellular';

export default function App() {

  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);
  const [places, setPlaces] = useState([]);
  const [appIsReady, setAppIsReady] = useState(false);
  const [countryCode, setCountryCode] = useState("en");

  let callWikipedia = () => {
    if (Cellular.isoCountryCode) {
      setCountryCode(Cellular.isoCountryCode.toString());
    }
    let apiEndpoint = "https://" + countryCode + ".wikipedia.org/w/api.php";
    let params = "action=query" + "&" +
      "format=json" + "&" +
      "prop=coordinates|pageimages|description|info" + "&" +
      "pithumbsize=144" + "&" +
      "generator=geosearch" + "&" +
      "ggsradius=10000" + "&" +
      "ggslimit=10" + "&" +
      "ggscoord=" + location.coords.latitude.toString() + "|" + location.coords.longitude.toString() + "&";

    fetch(apiEndpoint + "?" + params + "&origin=*")
      .then(function (response) { return response.json(); })
      .then(function (response) {
        let result = [];
        for (let i in response.query.pages) {
          let page = response.query.pages[i];
          let place = {
            title: page.title,
            pageID: page.pageid,
            coordinates: {
              lat: page.coordinates[0].lat,
              lon: page.coordinates[0].lon
            },
            desc: page.description
          }
          if (place.desc) {
            place.desc = (place.desc.charAt(0).toUpperCase() + place.desc.slice(1));
          }
          if (page.thumbnail) {
            place.thumbnail = { uri: page.thumbnail.source };
          }
          result.push(place);
        }
        setPlaces(result)
      });
  }

  let approximateDistance = (lat1, lon1, lat2, lon2) => {
    lat1 = lat1 * Math.PI / 180;
    lon1 = lon1 * Math.PI / 180;
    lat2 = lat2 * Math.PI / 180;
    lon2 = lon2 * Math.PI / 180;

    let dist = Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.pow(Math.sin((lon2 - lon1) / 2), 2);

    return (6371 * 2 * Math.asin(Math.sqrt(dist))).toPrecision(2)
  }

  useEffect(() => {
    (async () => {
      await SplashScreen.preventAutoHideAsync();
      let { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        setError(true);
        await SplashScreen.hideAsync();
      } else {
        SplashScreen.hideAsync();
        setLocation(await Location.getCurrentPositionAsync({ accuracy: 6 }));
        // try again
        if (location == null) {
          setRetries(retries + 1);
        } else {
          callWikipedia();
          setAppIsReady(true);
        }
      }
    })();
  }, [retries]);

  const styles = StyleSheet.create({
    backgroundImage: {
      height: Dimensions.get('screen').height,
      width: Dimensions.get('screen').width,
      resizeMode: "contain",
      position: "absolute",
    },
    container: {
      height: Dimensions.get('screen').height,
      width: Dimensions.get('screen').width,
      backgroundColor: "#cddced"
    },
    scrollView: {
      position: "absolute",
      height: Dimensions.get('screen').height,
      paddingTop: 110
    },
    nav: {
      paddingTop: 10,
      paddingHorizontal: 20,
      width: Dimensions.get('screen').width,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      position: 'absolute',
      zIndex: 1,
      top: Constants.statusBarHeight
    },
    title: {
      marginTop: -5,
      letterSpacing: -2,
      color: "#222",
      fontSize: 45,
      fontFamily: 'Didot'
    },
    bold: {
      fontWeight: "bold",
      letterSpacing: 0
    },
    card: {
      marginLeft: 80,
      marginRight: Dimensions.get('screen').width - Dimensions.get('screen').width * 0.7 - 80,
      backgroundColor: '#fff',
      borderRadius: 35,
      width: Dimensions.get('screen').width * 0.7,
      padding: 20,
      shadowColor: '#222222',
      shadowOffset: {
        width: 0,
        height: 20,
      },
      shadowOpacity: 0.15,
      shadowRadius: 50
    },
    cardOuter: {
      width: Dimensions.get('screen').width
    },
    bottomIcons: {
      top: 15,
      marginLeft: 80,
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      bottom: 0,
      width: Dimensions.get('screen').width * 0.7
    },
    image: {
      top: 3,
      borderRadius: 50,
      marginHorizontal: 15,
      width: Dimensions.get('screen').width * 0.15,
      height: Dimensions.get('screen').width * 0.15,
      borderColor: "white",
      borderWidth: 4
    },
    bottomIconsInner: {
      marginHorizontal: 15,
      borderRadius: 25,
      color: "white",
      paddingHorizontal: 18,
      paddingVertical: 12,
      width: (Dimensions.get('screen').width * 0.7 - 60) / 3,
      height: (Dimensions.get('screen').width * 0.7 - 60) / 3
    },
    header: {
      fontWeight: "bold",
      fontSize: 24,
      paddingVertical: 10
    },
    desc: {
      fontSize: 16,
      paddingBottom: 5
    },
    map: {
      color: "#222222",
      display: "flex",
      flexDirection: "row",
      transform: [{ rotateZ: "270deg" }],
      left: -35,
      top: 90,
      position: "absolute",
      marginVertical: 10
    },
    mapText: {
      fontSize: 16,
      marginTop: 2
    },
    mapIcon: {
      paddingLeft: 30,
      paddingRight: 4,
      marginTop: -1
    },
    credits: {
      position: "absolute",
      bottom: 140,
      right: -90,
      transform: [{ rotateZ: "270deg" }]
    }
  });

  if (!appIsReady && !error) {
    return (
      <View style={styles.container}>
        <Image source={require('./assets/splash.png')} style={styles.backgroundImage}></Image>
        <Image source={require('./assets/loading.gif')} style={styles.backgroundImage}></Image>
      </View>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>

        <View style={styles.nav}>
          <Text style={styles.title}>nearby <Text style={styles.bold}>places</Text></Text>
        </View>

        <Image source={require('./assets/splash.png')} style={styles.backgroundImage}></Image>

        <View style={{ marginTop: 110 }}>
          <View style={styles.card}>
            <Text style={{ fontSize: 16 }}>Location permissions not granted.</Text>
          </View>
        </View>

        <View style={styles.credits}>
          <Text style={{ color: "white" }}>Illustrations by Murat Kalkavan from Icons8</Text>
        </View>

      </SafeAreaView >
    );
  }

  else return (
    <SafeAreaView style={styles.container}>

      <View style={styles.nav}>
        <Text style={styles.title}>nearby <Text style={styles.bold}>places</Text></Text>
      </View>

      <Image source={require('./assets/backpack-image-1.png')} style={styles.backgroundImage}></Image>

      <ScrollView style={styles.scrollView}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={200}
        decelerationRate="fast"
        alwaysBounceHorizontal
        horizontal={true}>

        {places.map(place => (
          <View key={place.pageID} style={styles.cardOuter}>
            <View style={styles.card}>
              <Text style={styles.header}>{place.title}</Text>
              {place.desc && <Text style={styles.desc}>{place.desc}</Text>}
            </View>

            <View style={styles.map}>
              <Text style={styles.dist}>
                <Ionicons name="ios-pin" size={20} color="#222222" />
                {' ' +
                  approximateDistance(
                    place.coordinates.lat,
                    place.coordinates.lon,
                    location.coords.latitude,
                    location.coords.longitude) +
                  ' km'}
              </Text>
              <Ionicons style={styles.mapIcon} name="md-map" size={18} color="#222222" />
              <Text
                style={styles.mapText}
                onPress={
                  () => {
                    let s = `https://www.openstreetmap.org/#map=19/${place.coordinates.lat}/${place.coordinates.lon}`;
                    WebBrowser.openBrowserAsync(s)
                  }
                }>
                Open Maps</Text>
            </View>

            <View style={styles.bottomIcons}>
              <View style={styles.bottomIconsInner}>
                <Ionicons
                  name="ios-send"
                  color={"white"}
                  size={Dimensions.get('screen').width * 0.1}
                  onPress={
                    () =>
                      SMS.sendSMSAsync("", `https://${countryCode}.wikipedia.org/?curid=${place.pageID}`)
                  } />
              </View>
              {place.thumbnail &&
                <Image source={place.thumbnail} style={styles.image}>
                </Image>
              }

              <View style={styles.bottomIconsInner} >
                <Ionicons
                  name="md-book"
                  color={"white"}
                  size={Dimensions.get('screen').width * 0.1}
                  onPress={
                    () =>
                      WebBrowser.openBrowserAsync(`https://${countryCode}.wikipedia.org/?curid=${place.pageID}`)
                  } />
              </View>
            </View>
          </View>
        ))
        }
      </ScrollView>

      <View style={styles.credits}>
        <Text style={{ color: "white" }}>Illustrations by Murat Kalkavan from Icons8</Text>
      </View>

    </SafeAreaView >
  );

}
