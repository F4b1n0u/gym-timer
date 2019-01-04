import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, TouchableOpacity, Easing, Text } from 'react-native'
import * as d3 from 'd3'

import Animated from 'react-native-reanimated'

import Timer, { LOOP_OUT_DURATION } from './Timer'

const {
  abs,
  add,
  and,
  atan,
  block,
  Clock,
  clockRunning,
  color: animatedColor,
  cond,
  divide,
  call,
  round,
  eq,
  event,
  greaterThan,
  greaterOrEq,
  debug,
  interpolate,
  lessOrEq,
  lessThan,
  modulo,
  floor,
  multiply,
  neq,
  not,
  onChange,
  or,
  set,
  sqrt,
  startClock,
  stopClock,
  sub,
  timing,
  Value,
} = Animated

const SEQUENCE_STATE = {
  STOPPED: 0,
  PAUSED: 1,
  STARTED: 2,
}

TIMER_STATE = {
  IN: 0,
  LOOP_IN: 1,
  LOOP_OUT: 1,
}

const { width: windowWidth } = Dimensions.get('window')


function runSequence({ clock, timers, sequenceState }) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    frameTime: new Value(0),
    time: new Value(0),
  }

  const config = {
    toValue: new Value(0),
    duration: new Value(0),
    easing: Easing.in(Easing.elastic(1)),
  }

  return block([
    cond(and(eq(sequenceState, SEQUENCE_STATE.STARTED), neq(config.toValue, timers.length)), [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(config.toValue, timers.length),
      set(config.duration, new Value(timers.length * 1000)),
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

    this.state = {
      sequenceState: new Value(SEQUENCE_STATE.STOPPED),
    }
    this._pressState = new Value(0)
    this._clock = new Clock()

    const progressionDetail = modulo(this._tailProgression, 1)
    this._progressionRoot = floor(this._tailProgression)
    this._progessionPosition = cond(
      and(
        greaterOrEq(progressionDetail, 0),
        lessThan(progressionDetail, 1/3)
      ),
        TIMER_STATE.IN,
        cond(
          and(
            greaterOrEq(progressionDetail, 1/3),
            lessThan(progressionDetail, 2/3)
          ),
            TIMER_STATE.LOOP_IN,
            cond(
              and(
                greaterOrEq(progressionDetail, 2/3),
                lessThan(progressionDetail, 1)
              ),
              TIMER_STATE.LOOP_OUT,
            ),
        )
    )
  
    this._tailProgression = runSequence({
      clock: this._clock,
      timers: props.timers,
      state: this.state.sequenceState,
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

    const {
      sequenceState
    } = this.state

    return (
      <View
        style={styles.sequence}
        onPress={this._handlePressSequence}
        activeOpacity={1}
      >
        <Animated.Code>
          { () => onChange(this._pressState,
              block([
                cond(eq(sequenceState, SEQUENCE_STATE.STOPPED),
                  set(sequenceState, SEQUENCE_STATE.STARTED),
                  cond(eq(sequenceState, SEQUENCE_STATE.STARTED),
                    set(sequenceState, SEQUENCE_STATE.PAUSED),
                    cond(eq(sequenceState, SEQUENCE_STATE.PAUSED),
                      set(sequenceState, SEQUENCE_STATE.PAUSED),
                    ),
                  ),
                ),
              ]),
            )
          }
        </Animated.Code>
        {/* <Text
          style={{
            color: '#FFFFFF',
          }}
        >
          {sequenceState}
        </Text> */}

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
