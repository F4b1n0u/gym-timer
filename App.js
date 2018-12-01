import React from 'react'
import { StyleSheet, SafeAreaView, Animated, Easing, Dimensions, FlatList, View, Text } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

import Timer from './Timer'

const TIMER_DURATION = 3000

var { heigh: windowHeight, width: windowWidth } = Dimensions.get('window');
class App extends React.Component {
  constructor(props) {
    super(props)
    this.progressionTotal = new Animated.Value(0)

    this.sequences = [
      {
        id: 100,
        timers: [
          0,1,2,3
        ].map((id, index) => ({
            id,
            progression: this.progressionTotal,
            startAt: index,
            stopAt: index + 1,
        })),
      },
    ]
    
    this.animation = Animated.timing(
      this.progressionTotal,
      {
        toValue: 4,
        duration: TIMER_DURATION,
        easing: Easing.linear,
      },
    )
  }
  
  componentDidMount() {
    this._startAnimation();
  }

  _startAnimation = () => {
    this.animation.start(() =>{
      this.progressionTotal.setValue(0)
      this._startAnimation()
    })
  }

  render() {
    const d = ''

    return (
      <SafeAreaView
        style={styles.app}
      >
        <FlatList
          style={styles.sequences}          
          horizontal
          data={this.sequences}
          pagingEnabled
          keyExtractor={({ id }) => `${id}`}
          renderItem={({ item: { timers } }) => (
            <View
              style={styles.sequence}
            >
              <FlatList
                data={timers}
                keyExtractor={({ id }) => `${id}`}
                renderItem={({ item: timer }) => (
                  <Timer
                    {...timer}
                  />
                )}
              />
            </View>
          )}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#000000',
  },
  sequences: {},
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  }
})

export default App
