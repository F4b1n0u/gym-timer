import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, TouchableOpacity, Text } from 'react-native'

import Animated, { Easing } from 'react-native-reanimated'

import Timer, { LOOP_OUT_DURATION } from './Timer'

const {
  add,
  and,
  block,
  Clock,
  cond,
  eq,
  debug,
  neq,
  onChange,
  set,
  startClock,
  stopClock,
  timing,
  Value,
} = Animated

const SEQUENCE_STATE = {
  STOPPED: 0,
  STARTED: 1,
  PAUSED: 2,
  RESUMED: 3,
}

const { width: windowWidth } = Dimensions.get('window')

function runSequence({ timers, sequenceState }) {
  const clock = new Clock()

  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }

  const config = {
    toValue: new Value(0),
    duration: new Value(0),
    easing: Easing.inOut(Easing.linear),
  }

  const quantityOfTimer = timers.length
  
  return block([
    cond(and(eq(sequenceState, SEQUENCE_STATE.STARTED), neq(config.toValue, quantityOfTimer)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, quantityOfTimer),
      set(config.duration, new Value(quantityOfTimer * 1000)),
      startClock(clock),
    ]),

    timing(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ])
}

class Sequence extends React.Component {
  constructor(props) {
    super(props)

    this._sequenceState = new Value(SEQUENCE_STATE.STARTED)
    this._pressState = new Value(0)
    
    this._tailProgression = runSequence({
      timers: props.timers,
      sequenceState: this._sequenceState,
    })
    this._headProgression = new Value(props.timers.length) // TODO bug in the head
  }

  _renderTimer = ({ item: timer, index }) => (
    <Timer
      {...timer}
      headProgression={this._headProgression}
      tailProgression={this._tailProgression}
      startsAt={index}
      endsAt={index + 1}
      isLast={index === this.props.timers.length - 1}
    />
  )

  _handlePressSequence = () => {
    this._pressState.setValue(add(this._pressState, 1))
  }

  _CellRendererComponent = ({ children, index, style, ...props }) => {
    const {
      timers,
    } = this.props

    return (
      <View
        style={[
          style, {
            zIndex: timers.length - index,
          },
        ]}
        index={index}
        {...props}
      >
        {children}
      </View>
    )
  }

  render() {
    const {
      timers,
    } = this.props

    return (
      <View
        style={styles.sequence}
        onPress={this._handlePressSequence}
        activeOpacity={1}
      >
        <Animated.Code>
          {() => block([
            onChange(this._pressState,
              [
                cond(eq(this._sequenceState, SEQUENCE_STATE.STOPPED),
                  set(this._sequenceState, SEQUENCE_STATE.STARTED),
                cond(eq(this._sequenceState, SEQUENCE_STATE.STARTED),
                  set(this._sequenceState, SEQUENCE_STATE.PAUSED),
                cond(eq(this._sequenceState, SEQUENCE_STATE.PAUSED),
                  set(this._sequenceState, SEQUENCE_STATE.RESUMED),
                cond(eq(this._sequenceState, SEQUENCE_STATE.RESUMED),
                  set(this._sequenceState, SEQUENCE_STATE.PAUSED),
                )))),
              ],
            ),
          ])}
        </Animated.Code>
       
        <FlatList
          ref={ ref => this._timersList = ref }
          data={timers}
          renderItem={this._renderTimer}
          scrollEventThrottle={8}
          CellRendererComponent={this._CellRendererComponent}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  sequence: {
    flexDirection: 'column',
    width: windowWidth,
  },
  animationControllerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    height: '100%',
    width: '100%',
  }
})

export default Sequence
