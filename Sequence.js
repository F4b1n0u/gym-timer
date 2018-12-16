import React from 'react'
import { StyleSheet, Dimensions, FlatList, View, Animated, TouchableOpacity, Easing, Text } from 'react-native'
import * as d3 from 'd3'

import Timer, { LOOP_OUT_DURATION } from './Timer'

const { width: windowWidth } = Dimensions.get('window')
class Sequence extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      animationState: 'STOPPED',
    }

    this._tailProgression = new Animated.Value(0)
    this._headProgression = new Animated.Value(props.timers.length) // TODO bug in the head
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
    switch (this.state.animationState) {
      case 'STOPPED':
        this.setState({
          animationState: 'STARTED',
        }, () => {
          this._playNextAnimation()
        })
        break
      case 'STARTED':
        this.setState({
          animationState: 'PAUSED'
        }, () => {
          this._tailProgression.stopAnimation()
        })
        break
      case 'PAUSED':
        this.setState({
          animationState: 'STARTED'
        }, () => {
          this._resumeCurrentAnimation()
        })
        break
      default:
        break
    }
  }

  _playNextAnimation = () => {
    const nextAnimationDetails = this._getNextAnimationDetails()
    if (nextAnimationDetails) {
      const {
        animation: nextAnimation,
        timer: nextTimer,
       } = nextAnimationDetails
  
      setTimeout(() => {
        this._timersList.scrollToItem({
          animated: true,
          item: nextTimer
        })
      }, 100)

      nextAnimation.start(() => {
        // TODO try to move that at the beginning of _playNextAnimation to avoid duplication of this if
        if (this.state.animationState === 'STARTED') {
          this._playNextAnimation()
        }
      })
    } else {
      // on no next
      animation = Animated.timing(
        this._tailProgression,
        {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        },
      ).start(() => {
        this._playNextAnimation()
      })
    }
  }

  _resumeCurrentAnimation = () => {
    const {
      timers,
    } = this.props

    const tailProgression = this._tailProgression.__getValue()
    const progressionRoot = Math.floor(tailProgression)
    const timer = timers[progressionRoot]

    const {
      durations: {
        in: durationIn,
        loop: durationLoop,
      },
      easings: {
        in: inEasing,
      }
    } = timer

    // TODO check if there is a transition, if yes you need to count that too !
    // TODO check if an interpolation could not do the job for us

    const progressionPosition = this._getProgessionPosition()
    let animationDuration
    let animationProgressionTarget
    let easing 
    switch(progressionPosition) {
      case 'IN':
        animationDuration = durationIn
        animationProgressionTarget = progressionRoot + 1/3
        easing = inEasing
        break
      case 'LOOP_IN':
        animationDuration = durationLoop - LOOP_OUT_DURATION
        animationProgressionTarget = progressionRoot + 2/3
        easing = Easing.inOut(Easing.linear)
        break
      case 'LOOP_OUT':
        animationDuration = LOOP_OUT_DURATION
        animationProgressionTarget = progressionRoot + 1
        easing = Easing.inOut(Easing.linear)
        break
      default:
        break
    }

    const remainingDuration = (animationProgressionTarget - tailProgression) * 3 * animationDuration
    
    function resumed_ease( ease, elapsed_time ) {
      var y = typeof ease == "function" ? ease : d3.ease.call(d3, ease)
      return function( x_resumed ) {
          var x_original = d3.scaleLinear()
                          .domain([0,1])
                          .range([elapsed_time, 1])
                          ( x_resumed );
          return d3.scaleLinear()
                    .domain([ y(elapsed_time), 1])
                    .range([0,1])
                    ( y ( x_original ) );
      }
    }

    Animated.timing(
      this._tailProgression,
      {
        toValue: animationProgressionTarget,
        duration: remainingDuration,
        useNativeDriver: true,
        easing: resumed_ease(easing, remainingDuration),
      },
    ).start(() => {
      // TODO try to move that at the beginning of _playNextAnimation to avoid duplication of this if
      if (this.state.animationState === 'STARTED') {
        this._playNextAnimation()
      }
    })
  }

  _getProgessionPosition = () => {
    const tailProgression = this._tailProgression.__getValue()
    const progressionDetail = tailProgression % 1

    if (
      Number(progressionDetail.toFixed(4)) >= 0 &&
      Number(progressionDetail.toFixed(4)) < Number((1/3).toFixed(4))
    ) {
      return 'IN'
    } else if (
      Number(progressionDetail.toFixed(4)) >= Number((1/3).toFixed(4)) &&
      Number(progressionDetail.toFixed(4)) < Number((2/3).toFixed(4))
    ) {
      return 'LOOP_IN'
    } else if (
      Number(progressionDetail.toFixed(4)) >= Number((2/3).toFixed(4)) &&
      Number(progressionDetail.toFixed(4)) < 1
    ) {
      return 'LOOP_OUT'
    }
  }

  _getNextAnimationDetails = () => {
    const {
      timers,
    } = this.props

    const tailProgression = this._tailProgression.__getValue()
    const progressionRoot = Math.floor(tailProgression)
    const timer = timers[progressionRoot]
    
    if (!timer) {
      return
    }

    const {
      durations: {
        in: durationIn,
        loop: durationLoop,
      },
      easings: {
        in: inEasing,
      }
    } = timer

    let animation
    const progressionPosition = this._getProgessionPosition()
    
    switch(progressionPosition) {
      case 'IN':
        animation = Animated.timing(
          this._tailProgression,
          {
            toValue: progressionRoot + 1/3,
            duration: durationIn,
            useNativeDriver: true,
            easing: inEasing,
          },
        )
        break
      case 'LOOP_IN':
        animation = Animated.timing(
          this._tailProgression,
          {
            toValue: progressionRoot + 2/3,
            duration: durationLoop - LOOP_OUT_DURATION,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.linear),
          },
        )
        break
      case 'LOOP_OUT':
        animation = Animated.timing(
          this._tailProgression,
          {
            toValue: progressionRoot + 1,
            duration: LOOP_OUT_DURATION,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.linear),
          },
        )
        break
      default:
        break
    }

    return {
      animation,
      timer,
    }
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
      animationState
    } = this.state

    return (
      <TouchableOpacity
        style={styles.sequence}
        onPress={this._handlePressSequence}
        activeOpacity={1}
      >
        <Text
          style={{
            color: '#FFFFFF',
          }}
        >
          {animationState}
        </Text>

        <FlatList
          ref={ ref => this._timersList = ref }
          data={timers}
          renderItem={this._renderTimer}
          scrollEventThrottle={8}
          CellRendererComponent={this._CellRendererComponent}
        />
      </TouchableOpacity>
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
