import React from 'react'
import { StyleSheet, SafeAreaView, Animated, Easing, Dimensions, FlatList, View, Text } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

import Timer from './Timer'

var { heigh: windowHeight, width: windowWidth } = Dimensions.get('window');

const TIMER_DURATION = 5000
const TIMER_INTERVAL_DURATION = 1000
const TIMER_SECOND_LOOP_DURATION = 2000
const ITEM_HEIGHT = windowWidth
const HAS_INTERVAL = false

const timerIds = [
  0,1,
  2,3
  ,4,5,6,7,8,9,
  // 10,11,12,13,14,15,16,17,18,19,
  // 20,21,22,23,24,25,26,27,28,29,
  // 30,31,32,33,34,35,36,37,38,39,
  // 40,41,42,43,44,45,46,47,48,49,
  // 50,51,52,53,54,55,56,57,58,59,
  // 60,61,62,63,64,65,66,67,68,69,
  // 70,71,72,73,74,75,76,77,78,79,
  // 80,81,82,83,84,85,86,87,88,89,
  // 90,91,92,93,94,95,96,97,98,99
]

class App extends React.Component {
  constructor(props) {
    super(props)
    this.progressionTotal = new Animated.Value(0)

    this.sequences = [
      {
        id: 100,
        timers: timerIds.map((id, index) => ({
          id,
          progression: {
            animated: this.progressionTotal,
            startAt: index,
            stopAt: index + 1,
          },
          steps:{
            inStartAt: 0,
            loopStartAt: 1 / (TIMER_DURATION) * (TIMER_INTERVAL_DURATION / 2),
            loopHalfAt: 1 - (1 / (TIMER_DURATION) * TIMER_SECOND_LOOP_DURATION),
            outStartAt: 1 - (1 / (TIMER_DURATION) * (TIMER_INTERVAL_DURATION / 2)),
          },
          easings: {
              // with transition
              in: Easing.in(Easing.bounce),
              // loopStart: Easing.in(Easing.ease),
              loopEnd: Easing.out(Easing.ease),
              out: Easing.out(Easing.linear),
          },
          transitions: {
            in: true,
            out: true,
          }
        })),
      },
    ]
    
    console.log(this.sequences)

    this.animation = Animated.timing(
      this.progressionTotal,
      {
        toValue: timerIds.length,
        duration: TIMER_DURATION * timerIds.length,
        easing: Easing.linear,
        useNativeDriver: true,
      },
    )

    this._sequences = {}
  }
  
  componentDidMount() {
    
    const sequenceNode = this._sequences[100]
    let nextTimerIndex = 1

    setTimeout(() => {
      this._startAnimation();
    }, 250) 
    
    this._interval = setInterval(() => {
      sequenceNode.scrollToItem({
        animated: true,
        item: sequenceNode.props.data[nextTimerIndex],
      })
      nextTimerIndex++
    }, TIMER_DURATION)
    
  }

  componentWillUnmount = () => {
    clearInterval(this._interval)
  }

  _startAnimation = () => {
    this.animation.start(() =>{
      this.progressionTotal.setValue(0)
      this._startAnimation()
    })
  }

  _renderSequence = ({ item: { id, timers } }) => (
    <View
      style={styles.sequence}
    >
      <FlatList
        ref={ ref => this._sequences[id] = ref }
        // scrollEventThrottle={16}
        data={timers}
        keyExtractor={this._keyExtractor}
        // getItemLayout={(data, index) => (
        //   {
        //     length: ITEM_HEIGHT,
        //     offset: ITEM_HEIGHT * index,
        //     index
        //   }
        // )}
        renderItem={this._renderTimer}
      />
    </View>
  )

  _keyExtractor = ({ id }) => `${id}`

  _renderTimer = ({ item: timer }) => (
    <Timer
      {...timer}
    />
  )

  render() {
    const d = ''

    return (
      <SafeAreaView
        style={styles.app}
      >
        <FlatList
          // scrollEventThrottle={16}
          // isInteraction={false}
          style={styles.sequences}          
          horizontal
          data={this.sequences}
          pagingEnabled
          keyExtractor={this._keyExtractor}
          renderItem={this._renderSequence}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#000',
    
  },
  sequences: {
    backgroundColor: '#000',
  },
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  }
})

export default App
