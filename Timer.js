import React from 'react'
import { StyleSheet, Text, View, Dimensions } from 'react-native'
import memoize from 'fast-memoize'
import Color from 'color'

import Loop from './Loop'

const ANIMATION_PRECISION = 4
const { width: windowWidth } = Dimensions.get('window')

export const LOOP_OUT_DURATION = 5000
class Timer extends React.Component {
  constructor(props) {
    super(props)

    const {
      durations: {
        loop,
      },
    } = props

    this.state = {
      countdown: loop / 1000,
    }
  }

  _getLoopInDuration = () => {
    const {
      durations: {
        loop,
      },
    } = this.props

    return loop - LOOP_OUT_DURATION
  }
  
  componentWillMount() {
    const {
      tailProgression,
    } = this.props

    tailProgression.addListener(this._handleTailMoveForCountDown)
  }

  componentWillUnmount() {
    const {
      tailProgression,
    } = this.props
    
    tailProgression.removeListener(this._handleTailMoveForCountDown)
  }

  render() {
    const {
      countdown,
    } = this.state

    return (
      <View
        style={styles.timer}
      >
        <Loop
          {...this.props}
          width={15 / 100}
          loopRadius={3 / 10}
          xStartPosition={2 / 10}
          borderWidth={8 / 100}
          fillColor={Color(`#5A7AED`).hex()}
          borderColor={`#fff`}
        />

        <Text
          style={styles.countdown}
        >
          {countdown}
        </Text>
      </View>

    )
  }

  _handleTailMoveForCountDown = ({ value }) => {
    this._setCountdown(Number(value.toFixed(ANIMATION_PRECISION)))
  }

  _setCountdown = (tailProgression) => {
    const {
      durations: {
        loop: loopDuration,
      },
      startsAt,
    } = this.props

    const {
      countdown,
    } = this.state

    const relativeTailProgression = tailProgression - startsAt

    const duration =  Math.floor(loopDuration + 1000)
    let relativeProgression
    let secondRate

    if (relativeTailProgression >= 1/3 && relativeTailProgression < 2/3) {  // in the in loop
      relativeProgression = (relativeTailProgression - 1/3) * 3           // (0 -> 1)
      secondRate = this._getLoopInDuration() * relativeProgression                   // (0 -> loopInDuration)

      const newCountdown = Math.floor((duration - secondRate) / 1000)
      if (countdown !== newCountdown) {
        this.setState({
          countdown: newCountdown
        })
      }
    } else if (relativeTailProgression >= 2/3 && relativeTailProgression < 1) { // in the out loop
      const relativeProgression = (relativeTailProgression - 2/3) * 3            // (0 -> 1)
      secondRate = LOOP_OUT_DURATION * relativeProgression                        // (0 -> loopInDuration)

      const newCountdown = Math.floor((duration - this._getLoopInDuration() - secondRate) / 1000)

      if (countdown !== newCountdown) {
        this.setState({
          countdown: newCountdown
        })
      }
    } else if (relativeTailProgression > 1 && countdown !== 0) {
      this.setState({
        countdown: 0
      })
    }
  }
}

const styles = StyleSheet.create({
  timer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: windowWidth,
  },
  countdown: {
    color: '#fff',
    position: 'absolute',
    fontSize: 140,
    textAlign: 'center',
    width: '100%',
  }
})

export default Timer
