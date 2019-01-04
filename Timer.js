import React from 'react'
import { StyleSheet, Text, View, Dimensions } from 'react-native'
import Color from 'color'

import Loop from './Loop'

export const ANIMATION_PRECISION = 4
export const LOOP_OUT_DURATION = 5000

const { width: windowWidth } = Dimensions.get('window')

class Timer extends React.Component {
  constructor(props) {
    super(props)

    const {
      durations: {
        loop,
      },
    } = props
  }

  _getLoopInDuration = () => {
    const {
      durations: {
        loop,
      },
    } = this.props

    return loop - LOOP_OUT_DURATION
  }
  
  render() {
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
      </View>

    )
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
