import React from 'react'
import { StyleSheet, Animated, View, Easing } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'
import Color from 'color'

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

const TIMER_WIDTH = 1.5 / 10
const TIMER_WIDTH_DELTA = TIMER_WIDTH / 2
const TIMER_RADIUS = 3 / 10
const TIMER_START_POSITION = 2 / 10
const TIMER_BORDER_WIDTH = .8 / 100

// #5A7AED
// #DEA950
// #212121
const TIMER_COLOR = Color('#5A7AED') 
const TIMER_TRAIL_COLOR = TIMER_COLOR.lightness(8)

class Timer extends React.Component {
  constructor(props) {
    super(props)

    const {
      progression: {
        startAt,
        stopAt,
        animated,
      },
      steps: {
        inStartAt,
        loopStartAt,
        loopHalfAt,
        outStartAt,
      },
      easings: {
        in: easingIn,
        loopStart: easingLoopStart,
        loopEnd: easingLoopEnd,
        out: easingOut,
    },
    } = props

    const getStep = (ratio) => {
      return startAt + Math.abs(stopAt - startAt) * ratio
    }

    this.tailPositionDelta = animated.interpolate({
      inputRange:  [getStep(inStartAt),                  getStep(loopStartAt)],
      outputRange: [-TIMER_WIDTH/2 - TIMER_BORDER_WIDTH, 1/2],
      extrapolate: 'clamp',
      easing: easingIn,
      useNativeDriver: true,
    })
    this.firstArcRotationProgression = animated.interpolate({
      inputRange:  [getStep(loopStartAt), getStep(loopHalfAt)],
      outputRange: [Math.PI,              Math.PI * 2],
      extrapolate: 'clamp',
      easing: easingLoopStart,
      useNativeDriver: true,
    })

    this.secondArcRotationProgression = animated.interpolate({
      inputRange:  [getStep(loopHalfAt), getStep(outStartAt)],
      outputRange: [0,                   Math.PI],
      extrapolate: 'clamp',
      easing: easingLoopEnd,
      useNativeDriver: true,
    })
    this.headPositionDelta = animated.interpolate({
      inputRange:  [getStep(outStartAt), getStep(1)],
      outputRange: [0,                   3/6 + TIMER_WIDTH/2 ],
      extrapolate: 'clamp',
      easing: easingOut,
      useNativeDriver: true,
    })

    animated.addListener(this._setArcsSvgPathD)
  }
  
  componentDidMount() {
    const {
      progression: {
        animated,
      }
    } = this.props

    this._setArcsSvgPathD({ value: animated._value })
  }

  componentWillMount() {
    const {
      progression: {
        animated,
      }
    } = this.props

    animated.removeListener(this._setFirstArcSvgPathD);
  }

  render() {
    const d = ''

    return (
      <View>
        <Svg
          style={styles.timer}
          viewBox={`0 0 1 1`}
        >
          <AnimatedSvgPath
            d={this._getFirstArcSvgPathD(3/6, Math.PI * 2)}
            fill={TIMER_TRAIL_COLOR.hex()}
          />
          <AnimatedSvgPath
            d={this._getSecondArcSvgPathD(Math.PI, 3/6)}
            fill={TIMER_TRAIL_COLOR.hex()}
          />

          <AnimatedSvgPath
            ref={ ref => this._firstArcSvgPath = ref }
            d={d}
            stroke="black"
            fill={TIMER_COLOR.hex()}
            strokeWidth={TIMER_BORDER_WIDTH}
          />
          
          <AnimatedSvgPath
            ref={ ref => this._secondArcSvgPath = ref }
            d={d}
            stroke="black"
            fill={TIMER_COLOR.hex()}
            strokeWidth={TIMER_BORDER_WIDTH}
          />
        </Svg>
      </View>
    )
  }

  _setArcsSvgPathD = (progression) => {
    const {
      progression: {
        startAt,
        stopAt
      },
      steps: {
        loopHalfAt,
      }
    } = this.props
    if (progression.value < startAt || progression.value > stopAt) {
      return null
    }

    const tailPositionDeltaValue = this.tailPositionDelta.__getValue()
    const firstArcRotationProgressionValue = this.firstArcRotationProgression.__getValue()

    const secondArcRotationProgression = this.secondArcRotationProgression.__getValue()
    const headPositionDelta = this.headPositionDelta.__getValue()

    const firstArcSvgPathD= this._getFirstArcSvgPathD(tailPositionDeltaValue, firstArcRotationProgressionValue)
    const secondArcSvgPathD= this._getSecondArcSvgPathD(secondArcRotationProgression, headPositionDelta)

    this._firstArcSvgPath && this._firstArcSvgPath.setNativeProps({ d: firstArcSvgPathD});
    
    if(progression.value > startAt + Math.abs(stopAt - startAt) * loopHalfAt) {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: secondArcSvgPathD});
    } else {
      this._secondArcSvgPath && this._secondArcSvgPath.setNativeProps({ d: ''});
    }
  }
 
  _getFirstArcSvgPathD = memoize((tailPositionDeltaValue, firstArcRotationProgressionValue) => {
    return `
      M
      ${TIMER_START_POSITION - TIMER_WIDTH_DELTA}
      ${0}

      l
      ${0}
      ${tailPositionDeltaValue}
      
      a
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue) + 1) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      ${(-1 * Math.sin(firstArcRotationProgressionValue)) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      
      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${(+1 * Math.cos(firstArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}
      ${(-1 * Math.sin(firstArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}

      A
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      0 0 1
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA}
      ${tailPositionDeltaValue}

      L
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA}
      ${0}

      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${- 2 * TIMER_WIDTH_DELTA}
      ${0}
      Z
    `
  })

  _getSecondArcSvgPathD = memoize((secondArcRotationProgressionValue, headPositionDeltaValue) => {
    return `
      M
      ${TIMER_START_POSITION + TIMER_WIDTH_DELTA + 2 * TIMER_RADIUS}
      ${1/2}

      a
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS + TIMER_WIDTH_DELTA}
      0 0 0
      ${(1 * Math.cos(secondArcRotationProgressionValue) - 1) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}
      ${(-1 * Math.sin(secondArcRotationProgressionValue)) * (TIMER_RADIUS + TIMER_WIDTH_DELTA)}

      l
      ${0}
      ${headPositionDeltaValue}

      a
      ${TIMER_WIDTH_DELTA / 6}
      ${TIMER_WIDTH_DELTA / 6}
      0 0 0
      ${(+1 * Math.cos(secondArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}
      ${(-1 * Math.sin(secondArcRotationProgressionValue + Math.PI)) * (TIMER_WIDTH)}

      l
      ${0}
      ${-headPositionDeltaValue}

      A
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      ${TIMER_RADIUS - TIMER_WIDTH_DELTA}
      0 0 1
      ${TIMER_START_POSITION - TIMER_WIDTH_DELTA + 2 * TIMER_RADIUS}
      ${1/2}
    `
  })
}

const styles = StyleSheet.create({
  timer: {
    width: '100%',
    aspectRatio: 1,
    // borderWidth: 1,
    borderColor: "grey",
  }
})

export default Timer
