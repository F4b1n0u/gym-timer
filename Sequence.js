import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, Animated } from 'react-native'
import Color from 'color'

import Loop from './Loop'

const { width: windowWidth } = Dimensions.get('window');

class Sequence extends React.Component {
  constructor(props) {
    super(props)

    this._headProgression = new Animated.Value(props.timers.length)
    this._tailProgression = new Animated.Value(0)
  }

  _keyExtractor = ({ id }) => `${id}`

  _renderTimer = ({ item: timer, index }) => (
    <Loop
      {...timer}
      width={15 / 100}
      loopRadius={3 / 10}
      xStartPosition={2 / 10}
      borderWidth={8 / 1000}
      fillColor={Color(`#5A7AED`).hex()}
      trailColor={Color(`#202020`).hex()}
      borderColor={`#fff`}
      headProgression={this._headProgression}
      tailProgression={this._tailProgression}
      startsAt={index}
      endsAt={index + 1}
    />
  )

  render() {
    const {
      timers,
    } = this.props

    return (
      <View
        style={styles.sequence}
      >
        <FlatList
          data={timers}
          keyExtractor={this._keyExtractor}
          renderItem={this._renderTimer}
          scrollEventThrottle={8}
        />
      </View>
    )
  }

  componentDidMount() {
    this._startAnimation()
  }

  _startAnimation = () => {
    const {
      timers,
    } = this.props

    Animated.sequence(
      timers.map(({
        durations: {
          in: durationIn,
          loopIn: durationLoopIn,
          loopOut: durationLoopOut,
          out: durationOut,
        },
        easings: {
          in: easingIn,
          loopIn: easingLoopIn,
          loopOut: easingLoopOut,
          out: easingOut,
        },
      }, index) => Animated.sequence([
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + .25,
            duration: durationIn,
            useNativeDriver: true,
            easing: easingIn,
          },
        ),
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + .5,
            duration: durationLoopIn,
            useNativeDriver: true,
            easing: easingLoopIn,
          },
        ),
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + .75,
            duration: durationLoopOut,
            useNativeDriver: true,
            easing: easingLoopOut,
          },
        ),
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + 1,
            duration: durationOut,
            useNativeDriver: true,
            easing: easingOut,
          },
        )
      ]))
    ).start(this._startAnimation)
  }
}

const styles = StyleSheet.create({
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  }
})

export default Sequence
