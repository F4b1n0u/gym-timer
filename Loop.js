import React from 'react'
import { StyleSheet, Animated, Easing } from 'react-native'
import memoize from 'fast-memoize'
import { Svg } from 'expo'

const HEAD = 0
const TAIL = 0

const AnimatedSvgPath = Animated.createAnimatedComponent(Svg.Path)

class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      width,
      borderWidth,
    } = props

    this._headProgression = new Animated.Value(HEAD)
    this._tailProgression = new Animated.Value(TAIL)

    const interpolations = {
      in: {
        inputRange:  [0,                      1],
        outputRange: [-width/2 - borderWidth, 1/2],
        extrapolate: 'clamp',
        easing: Easing.inOut(Easing.linear)
      },
      loopIn: {
        inputRange:  [1,       2],
        outputRange: [Math.PI, Math.PI * 2],
        extrapolate: 'clamp',
        easing: Easing.inOut(Easing.linear)
      },
      loopOut: {
        inputRange:  [2, 3],
        outputRange: [0, Math.PI],
        extrapolate: 'clamp',
        easing: Easing.inOut(Easing.linear)
      },
      out: {
        inputRange:  [3, 4],
        outputRange: [0, 3/6 + width/2 ],
        extrapolate: 'clamp',
        easing: Easing.inOut(Easing.linear)
      },
    }

    this.headIn = this._headProgression.interpolate(interpolations.in)
    this.headLoopIn = this._headProgression.interpolate(interpolations.loopIn)
    this.headLoopOut = this._headProgression.interpolate(interpolations.loopOut)
    this.headOut = this._headProgression.interpolate(interpolations.out)

    this.tailIn = this._tailProgression.interpolate(interpolations.in)
    this.tailLoopIn = this._tailProgression.interpolate(interpolations.loopIn)
    this.tailLoopOut = this._tailProgression.interpolate(interpolations.loopOut)
    this.tailOut = this._tailProgression.interpolate(interpolations.out)

    this._headProgression.addListener(this._setPaths)
    this._tailProgression.addListener(this._setPaths)
  }
  
  _startAnimation = () => {
    const {
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
    } = this.props

    // // head
    
    this._tailProgression.setValue(0)
    this._headProgression.setValue(0)
    
    Animated.sequence([
      Animated.timing(
        this._headProgression,
        {
          toValue: 4,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.linear),
        },
      ),
      Animated.delay(1000),
      Animated.timing(
        this._tailProgression,
        {
          toValue: 1,
          duration: durationIn,
          useNativeDriver: true,
          easing: easingIn,
        },
      ),
      Animated.timing(
        this._tailProgression,
        {
          toValue: 2,
          duration: durationLoopIn,
          useNativeDriver: true,
          easing: easingLoopIn,
        },
      ),
      Animated.timing(
        this._tailProgression,
        {
          toValue: 3,
          duration: durationLoopOut,
          useNativeDriver: true,
          easing: easingLoopOut,
        },
      ),
      Animated.timing(
        this._tailProgression,
        {
          toValue: 4,
          duration: durationOut,
          useNativeDriver: true,
          easing: easingOut,
        },
      )
    ]).start(this._startAnimation)
  }

  componentDidMount() {
    this._setPaths()

    this._startAnimation()
  }

  componentWillMount() {
    this._headProgression.removeListener(this._setPaths);
    this._tailProgression.removeListener(this._setPaths);
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
      trailColor,
    } = this.props

    const d = 'M 0 0'
    
    return (
      <Svg
        style={styles.loop}
        viewBox={`0 0 1 1`}
      >
        {trailColor && (
          <React.Fragment>
            <Svg.Path
              d={this._getWholeInPath(0, 0.5, Math.PI, 2 * Math.PI)}
              fill={trailColor}
            />
            <Svg.Path
              d={this._getWholeOutPath(0, Math.PI, 0, 1/2)}
              fill={trailColor}
            />
          </React.Fragment>
        )}
        
        <AnimatedSvgPath
          ref={ ref => this._loopOutElement = ref }
          d={d}
          stroke={borderColor}
          fill={fillColor}
          strokeWidth={borderWidth}
        />

        <AnimatedSvgPath
          ref={ ref => this._loopInElement = ref }
          d={d}
          stroke={borderColor}
          fill={fillColor}
          strokeWidth={borderWidth}
        />
      </Svg>
    )
  }

  _setPaths = () => {
    const headProgression = this._headProgression.__getValue()
    const tailProgression = this._tailProgression.__getValue()

    const headIn = this.headIn.__getValue()
    const headLoopIn = this.headLoopIn.__getValue()
    const headLoopOut = this.headLoopOut.__getValue()
    const headOut = this.headOut.__getValue()

    const tailIn = this.tailIn.__getValue()
    const tailLoopIn = this.tailLoopIn.__getValue()
    const tailLoopOut = this.tailLoopOut.__getValue()
    const tailOut = this.tailOut.__getValue()

    const wholeIntPath = this._getWholeInPath(tailIn, headIn, tailLoopIn, headLoopIn)
    const wholeOutPath = this._getWholeOutPath(tailLoopOut, headLoopOut, tailOut, headOut)

    if(headProgression <= 2 || tailProgression <=2) {
      this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath});
    } else {
      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' });
    }
    
    if(headProgression >= 2 || tailProgression >= 2) {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: wholeOutPath});
    } else {
      this._loopOutElement && this._loopOutElement.setNativeProps({ d: 'M 0 0'});
    }
  }
 
  _getWholeInPath = memoize((tailIn, headIn, tailLoop, headLoop) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props

    const headloopInt = {
      x: xStartPosition + (width / 2) + (Math.cos(headLoop) + 1) * (loopRadius - (width / 2)),
      y: headIn - (1 * Math.sin(headLoop)) * (loopRadius - (width / 2)),
    }
    const tailLoopInt = {
      x: xStartPosition + (width / 2) + ((Math.cos(tailLoop) + 1) * (loopRadius - (width / 2))),
      y: headIn - (1 * Math.sin(tailLoop)) * (loopRadius - (width / 2)),
    }
    const tailInInt = {
      dx: 0,
      dy: -1/2 + tailIn,
    }
    const tailInExt = {
      dx: 0,
      dy: 1/2 - tailIn,
    }

    const tailLoopExt = {
      dx: (-1 * Math.cos(tailLoop + Math.PI)) * (width),
      dy: (+1 * Math.sin(tailLoop + Math.PI)) * (width)
    }
    const headloopExt = {
      x: xStartPosition - (width / 2) + ((Math.cos(headLoop) + 1) * (loopRadius + (width / 2))),
      y: headIn - (1 * Math.sin(headLoop)) * (loopRadius + (width / 2)),
    }
    
    const path = `
      M
      ${headloopInt.x}
      ${headloopInt.y}
      
      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${tailLoopInt.x}
      ${tailLoopInt.y}

      l
      ${tailInInt.dx}
      ${tailInInt.dy}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${tailLoopExt.dx}
      ${tailLoopExt.dy}

      l
      ${tailInExt.dx}
      ${tailInExt.dy}

      A
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${headloopExt.x}
      ${headloopExt.y}
    `

    const cap = headLoop < 2 * Math.PI ? `
      A
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${headloopInt.x}
      ${headloopInt.y}
    ` : ''

    return `
      ${path}
      ${cap}
    `
  })

  _getWholeOutPath = memoize((tailLoop, headLoop, tailOut, headOut) => {
    const {
      width,
      xStartPosition,
      loopRadius,
    } = this.props
    
    center = {
      x: xStartPosition + loopRadius,
      y: 1/2,
    }

    const tailLoopExt = { // OK
      x: center.x + Math.cos(tailLoop) * (loopRadius + (width / 2)),
      y: center.y + -1 * Math.sin(tailLoop) * (loopRadius + (width / 2)) + tailOut,
    }
    const headLoopExt = {
      x: center.x + Math.cos(headLoop) * (loopRadius + (width / 2)),
      y: center.y + -1 * Math.sin(headLoop) * (loopRadius + (width / 2)) + tailOut,
    }
    const headOutExt = {
      x: headLoopExt.x,
      y: headLoopExt.y + headOut,
    }
    const headOutInt = {
      dx:  1 * Math.cos(headLoop + Math.PI) * (width),
      dy: -1 * Math.sin(headLoop + Math.PI) * (width),
    }
    const headLoopInt = {
      x: center.x + Math.cos(headLoop) * (loopRadius - (width / 2)),
      y: center.y + -1 * Math.sin(headLoop) * (loopRadius - (width / 2)) + tailOut,
    }
    const tailLoopInt = {
      x: center.x + Math.cos(tailLoop) * (loopRadius - (width / 2)),
      y: center.y + -1 * Math.sin(tailLoop) * (loopRadius - (width / 2)) + tailOut,
    }

    const path = `
      M
      ${tailLoopExt.x}
      ${tailLoopExt.y}

      A
      ${loopRadius + (width / 2)}
      ${loopRadius + (width / 2)}
      0 0 0
      ${headLoopExt.x}
      ${headLoopExt.y}

      L
      ${headOutExt.x}
      ${headOutExt.y}

      a
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${headOutInt.dx}
      ${headOutInt.dy}

      L
      ${headLoopInt.x}
      ${headLoopInt.y}

      A
      ${loopRadius - (width / 2)}
      ${loopRadius - (width / 2)}
      0 0 1
      ${tailLoopInt.x}
      ${tailLoopInt.y}

      A
      ${(width / 2) / 6}
      ${(width / 2) / 6}
      0 0 0
      ${tailLoopExt.x}
      ${tailLoopExt.y}
    `

    return path
  })
}

const styles = StyleSheet.create({
  loop: {
    width: '100%',
    aspectRatio: 1,
    // borderWidth: 1,
    borderColor: "grey",
  }
})

export default Loop
