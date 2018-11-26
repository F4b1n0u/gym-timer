import React from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { hidden } from 'ansi-colors';

const state = {
  sequences: [
    {
      id: 1,
      timers: [
        {
          id: 11,
          activity: {
            name: 'activity 11',
          },
        },
        {
          id: 12,
          activity: {
            name: 'activity 12',
          },
        },
        {
          id: 13,
          activity: {
            name: 'activity 13',
          },
        },
      ]
    },
    {
      id: 2,
      timers: [
        {
          id: 21,
          activity: {
            name: 'activity 11',
          },
        },
        {
          id: 22,
          activity: {
            name: 'activity 12',
          },
        },
        {
          id: 23,
          activity: {
            name: 'activity 13',
          },
        },
      ]
    },
    {
      id: 3,
      timers: [
        {
          id: 21,
          activity: {
            name: 'activity 11',
          },
        },
        {
          id: 22,
          activity: {
            name: 'activity 12',
          },
        },
        {
          id: 23,
          activity: {
            name: 'activity 13',
          },
        },
      ]
    },
  ],
}

var {heigh: windowHeight, width: windowWidth} = Dimensions.get('window');

export default class App extends React.Component {
  render() {
    return (
      <SafeAreaView
        style={styles.app}
      >
        <FlatList
          style={styles.sequences}          
          horizontal
          data={state.sequences}
          pagingEnabled
          keyExtractor={({ id }) => `${id}`}
          renderItem={({ item: { id, timers } }) => (
            <View
              style={styles.sequence}
            >
              <FlatList
                data={timers}
                keyExtractor={({ id }) => `${id}`}
                renderItem={({ item: { name } }) => (
                  <View
                    style={styles.timer}
                  >
                    <Text>
                      {`${name}`}
                    </Text>
                  </View>
                )}
                ListFooterComponent={(
                  <View
                    style={styles.timer}
                  >
                    <Text>
                      {'+'}
                    </Text>
                  </View>
                )}
              />
            </View>
          )}
          ListFooterComponent={(
            <View
              style={styles.sequence}
            >
              <View
                style={styles.timer}
              >
                <Text>
                  {'+'}
                </Text>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#999',
  },
  sequences: {
    backgroundColor: '#f00',
    borderColor: '#0f0',
  },
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  },
  timer: {
    aspectRatio: 1,
    backgroundColor: '#ff0',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
