import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, Animated, Easing } from 'react-native'
import Color from 'color'

import Loop from './Loop'

const { width: windowWidth } = Dimensions.get('window');

class Sequence extends React.Component {
  constructor(props) {
    super(props)

    this._headProgression = new Animated.Value(props.timers.length)
    this._tailProgression = new Animated.Value(1)
  }

  _keyExtractor = ({ id }) => `${id}`

  _renderTimer = ({ item: timer, index }) => (
    <Loop
      {...timer}
      width={15 / 100}
      loopRadius={3 / 10}
      xStartPosition={2 / 10}
      borderWidth={8 / 100}
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
    // this._startAnimation()
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
        },
        easings: {
          in: inEasing,
          out: outEasing,
        }
      }, index) => Animated.sequence([
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + 1/3,
            duration: durationIn,
            useNativeDriver: true,
            easing: inEasing,
          },
        ),
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + 2/3,
            duration: durationLoopIn,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.linear),
          },
        ),
        Animated.timing(
          this._tailProgression,
          {
            toValue: index + 3/3,
            duration: durationLoopOut,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.linear),
          },
        ),
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
