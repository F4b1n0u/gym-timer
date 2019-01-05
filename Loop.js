import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Svg } from 'expo'

import Animated, { Easing } from 'react-native-reanimated'

const {
  add,
  and,
  block,
  call,
  concat,
  cond,
  cos,
  debug,
  divide,
  greaterOrEq,
  greaterThan,
  interpolate,
  lessOrEq,
  lessThan,
  multiply,
  not,
  or,
  set,
  sin,
  sub,
  Value,
} = Animated

export const RESOLUTION = 10

class Loop extends React.Component {
  constructor(props) {
    super(props)

    const {
      headProgression,
      tailProgression,
      easings: {
        loopIn: easingLoopIn,
        loopOut: easingLoopOut,
      },
      width,
      xStartPosition,
      loopRadius,
      startsAt,
      endsAt,
      isLast,
    } = props

    const interpolations = {
      relative: {
        inputRange:  [startsAt, endsAt],
        outputRange: [0,        3/3],
        easing: Easing.inOut(Easing.linear),
      },
      in: {
        inputRange:  [0, 1/3],
        outputRange: [0,                1],
        easing: Easing.inOut(Easing.linear),
        extrapolate: 'clamp',
      },
      loopIn: {
        inputRange:  [1/3, 2/3],
        outputRange: [Math.PI,    Math.PI * 2],
        easing: easingLoopIn,
        extrapolate: 'clamp',
      },
      loopOut: {
        inputRange:  [2/3, 1],
        outputRange: [0,                Math.PI],
        easing: easingLoopOut,
        extrapolate: 'clamp',
      },
    }

    this._relativeHeadProgression = interpolate(headProgression, interpolations.relative)
    this._relativeTailProgression = interpolate(tailProgression, interpolations.relative)

    this._isRunningIn = and(
      greaterThan(tailProgression, startsAt),
      lessOrEq(tailProgression, startsAt + 2/3),
    )
    this._isRunningOut = and(
      greaterThan(tailProgression, startsAt + 2/3),
      lessThan(tailProgression, endsAt),
    )
    this._isRunning = or(this._isRunningIn, this._isRunningOut)
    this._isDone = greaterOrEq(tailProgression, endsAt)

    this._isInitialRenderDone = new Value(0)
    this._isCleanRenderDone = new Value(0)

    const headIn = interpolate(this._relativeHeadProgression, interpolations.in)
    const headLoopIn = interpolate(this._relativeHeadProgression, interpolations.loopIn)
    const headLoopOut = interpolate(this._relativeHeadProgression, interpolations.loopOut)

    const tailIn = interpolate(this._relativeTailProgression, interpolations.in)
    const tailLoopIn = interpolate(this._relativeTailProgression, interpolations.loopIn)
    const tailLoopOut = interpolate(this._relativeTailProgression, interpolations.loopOut)

    const halfWidth = divide(width, 2)
    const cosHeadLoopIn = cos(headLoopIn)
    const sinHeadLoopIn = sin(headLoopIn)
    const cosTailLoop = cos(tailLoopIn)
    const sinTailLoop = sin(tailLoopIn)
    const cosTailLoopPlusPI = cos(add(tailLoopIn, Math.PI))
    const sinTailLoopPlusPI = sin(add(tailLoopIn, Math.PI))
    const innerRadius = sub(loopRadius, halfWidth)
    const outterRadius = add(loopRadius, halfWidth)
    const capRadius = divide(halfWidth, 6)

    const headloopInt = {
      x: add(xStartPosition, halfWidth, multiply(add(cosHeadLoopIn, 1), innerRadius)),
      y: sub(headIn, multiply(sinHeadLoopIn, innerRadius)),
    }
    const tailLoopInt = {
      x: add(xStartPosition, halfWidth, multiply(add(cosTailLoop, 1), innerRadius)),
      y: sub(headIn, multiply(sinTailLoop, innerRadius)),
    }
    const tailInInt = {
      dx: new Value(0),
      dy: add(-1, tailIn),
    }
    const tailInExt = {
      dx: new Value(0),
      dy: sub(1, tailIn),
    }

    const tailLoopInExt = {
      dx: multiply(-1, cosTailLoopPlusPI, width),
      dy: multiply(sinTailLoopPlusPI, width)
    }
    const headloopInExt = {
      x: sub(xStartPosition, sub(halfWidth, multiply(add(cosHeadLoopIn, 1), outterRadius))),
      y: sub(headIn, multiply(sinHeadLoopIn, outterRadius)),
    }

    const path = concat(
      ' M ',
      multiply(headloopInt.x, RESOLUTION),
      ' ',
      multiply(headloopInt.y, RESOLUTION),
      
      ' A ',
      multiply(innerRadius, RESOLUTION),
      ' ',
      multiply(innerRadius, RESOLUTION),
      ' 0 0 1 ',
      multiply(tailLoopInt.x, RESOLUTION),
      ' ',
      multiply(tailLoopInt.y, RESOLUTION),

      ' l ',
      multiply(tailInInt.dx, RESOLUTION),
      ' ',
      multiply(tailInInt.dy, RESOLUTION),

      ' a ',
      multiply(capRadius, RESOLUTION),
      ' ',
      multiply(capRadius, RESOLUTION),
      ' 0 0 0 ',
      multiply(tailLoopInExt.dx, RESOLUTION),
      ' ',
      multiply(tailLoopInExt.dy, RESOLUTION),

      ' l ',
      multiply(tailInExt.dx, RESOLUTION),
      ' ',
      multiply(tailInExt.dy, RESOLUTION),

      ' A ',
      multiply(outterRadius, RESOLUTION),
      ' ',
      multiply(outterRadius, RESOLUTION),
      ' 0 0 0 ',
      multiply(headloopInExt.x, RESOLUTION),
      ' ',
      multiply(headloopInExt.y, RESOLUTION),
    )
  
    const cap = cond(lessThan(headLoopIn, 2 * Math.PI),
      concat(
        ' A ',
        multiply(capRadius, RESOLUTION),
        ' ',
        multiply(capRadius, RESOLUTION),
        ' 0 0 0 ',
        multiply(headloopInt.x, RESOLUTION),
        ' ',
        multiply(headloopInt.y, RESOLUTION),
      ),
      ''
    )
    this._wholeInPath = concat(
      path,
      cap,
    )

    const center = {
      x: add(xStartPosition, loopRadius),
      y: 1,
    }
   
    const cosHeadLoopOut = cos(headLoopOut)
    const sinHeadLoopOut = sin(headLoopOut)
    const cosTailLoopOut = cos(tailLoopOut)
    const sinTailLoopOut = sin(tailLoopOut)

    const tailLoopOutExt = {
      x: add(center.x, multiply(cosTailLoopOut, outterRadius)),
      y: add(center.y, multiply(-1, sinTailLoopOut, outterRadius)),
    }
    const headLoopOutExt = {
      x: add(center.x, multiply(cosHeadLoopOut, outterRadius)),
      y: add(center.y, multiply(-1, sinHeadLoopOut, outterRadius)),
    }
    const headLoopOutInt = {
      x: add(center.x, multiply(cosHeadLoopOut, innerRadius)),
      y: add(center.y, multiply(-1, sinHeadLoopOut, innerRadius)),
    }
    const tailLoopOutInt = {
      x: add(center.x, multiply(cosTailLoopOut, innerRadius)),
      y: add(center.y, multiply(-1, sinTailLoopOut, innerRadius)),
    }

    this._wholeOutFillPath = cond(greaterOrEq(tailLoopOut, Math.PI),
      'M 0 0',
      concat(
        ' M ',
        multiply(tailLoopOutExt.x, RESOLUTION),
        ' ',
        multiply(tailLoopOutExt.y, RESOLUTION),

        ' A ',
        multiply(add(loopRadius, halfWidth), RESOLUTION),
        ' ',
        multiply(add(loopRadius, halfWidth), RESOLUTION),
        ' 0 0 0 ',
        multiply(headLoopOutExt.x, RESOLUTION),
        ' ',
        multiply(headLoopOutExt.y, RESOLUTION),
        
        cond(isLast,
          concat(
            ' A ',
            multiply(capRadius, RESOLUTION),
            ' ',
            multiply(capRadius, RESOLUTION),
            ' 0 0 0 ',
            multiply(headLoopOutInt.x, RESOLUTION),
            ' ',
            multiply(headLoopOutInt.y, RESOLUTION),
          ),
          concat(
            ' L ',
            multiply(headLoopOutInt.x, RESOLUTION),
            ' ',
            multiply(headLoopOutInt.y, RESOLUTION),
          ),
        ),
        concat(
          ' A ',
          multiply(innerRadius, RESOLUTION),
          ' ',
          multiply(innerRadius, RESOLUTION),
          ' 0 0 1 ',
          multiply(tailLoopOutInt.x, RESOLUTION),
          ' ',
          multiply(tailLoopOutInt.y, RESOLUTION),
          ' A ',
          multiply(capRadius, RESOLUTION),
          ' ',
          multiply(capRadius, RESOLUTION),
          ' 0 0 0 ',
          multiply(tailLoopOutExt.x, RESOLUTION),
          ' ',
          multiply(tailLoopOutExt.y, RESOLUTION),
        ),
      ),
    )

    this._wholeOutBorderPath = cond(greaterOrEq(tailLoopOut,  Math.PI),
      'M 0 0 ',
      concat(
        ' M ',
        multiply(tailLoopOutExt.x, RESOLUTION),
        ' ',
        multiply(tailLoopOutExt.y, RESOLUTION),

        ' A ',
        multiply(add(loopRadius, halfWidth), RESOLUTION),
        ' ',
        multiply(add(loopRadius, halfWidth), RESOLUTION),
        ' 0 0 0 ',
        multiply(headLoopOutExt.x, RESOLUTION),
        ' ',
        multiply(headLoopOutExt.y, RESOLUTION),

        cond(isLast,
          concat(
            ' A ',
            multiply(capRadius, RESOLUTION),
            ' ',
            multiply(capRadius, RESOLUTION),
            ' 0 0 0 ',
            multiply(headLoopOutInt.x, RESOLUTION),
            ' ',
            multiply(headLoopOutInt.y, RESOLUTION),
          ),
          concat(
            ' M ',
            multiply(headLoopOutInt.x, RESOLUTION),
            ' ',
            multiply(headLoopOutInt.y, RESOLUTION),
          ),
        ),
        
        ' A ',
        multiply(innerRadius, RESOLUTION),
        ' ',
        multiply(innerRadius, RESOLUTION),
        ' 0 0 1 ',
        multiply(tailLoopOutInt.x, RESOLUTION),
        ' ',
        multiply(tailLoopOutInt.y, RESOLUTION),

        ' A ',
        multiply(capRadius, RESOLUTION),
        ' ',
        multiply(capRadius, RESOLUTION),
        ' 0 0 0 ',
        multiply(tailLoopOutExt.x, RESOLUTION),
        ' ',
        multiply(tailLoopOutExt.y, RESOLUTION),
      )
    )
  }

  render() {
    const {
      fillColor,
      borderColor,
      borderWidth,
    } = this.props

    const d = 'M 0 0'
    
    return (
      <View>
        <Animated.Code>
          {() => {
            return block([
              cond(or(not(this._isInitialRenderDone), this._isRunning),
                block([
                  cond(or(
                    this._isRunningIn,
                    not(this._isInitialRenderDone)
                  ),
                      call([ this._wholeInPath ], ([ wholeIntPath, ]) => {
                        this._loopInElement && this._loopInElement.setNativeProps({ d: wholeIntPath })
                      }),
                      call([], () => {
                        this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' })
                      })
                  ),
                  cond(or(
                    this._isRunningOut,
                    not(this._isDone),
                    not(this._isInitialRenderDone),
                  ),
                    block([
                      call([ this._wholeOutFillPath, this._wholeOutBorderPath ], ([ wholeOutFillPath, wholeOutBorderPath]) => {
                        this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: wholeOutFillPath })
                        this._loopOutBorderElement && this._loopOutBorderElement.setNativeProps({ d: wholeOutBorderPath })
                      }),
                    ]),
                  ),
                  cond(not(this._isInitialRenderDone), set(this._isInitialRenderDone, 1))
                ]),
                cond(and(
                  this._isDone,
                  not(this._isCleanRenderDone),
                ),
                  [
                    call([], () => {
                      this._loopInElement && this._loopInElement.setNativeProps({ d: 'M 0 0' })
                      this._loopOutFillElement && this._loopOutFillElement.setNativeProps({ d: 'M 0 0' })
                      this._loopOutBorderElement && this._loopOutBorderElement.setNativeProps({ d: 'M 0 0' })
                    }),
                    cond(not(this._isCleanRenderDone), set(this._isCleanRenderDone, 1))
                  ]
                )
              )
            ])
          }}
        </Animated.Code>
        <Svg
          style={styles.loop}
          viewBox={`0 0 ${RESOLUTION} ${RESOLUTION * 2}`}
        > 
          <Svg.Path
            ref={ ref => this._loopOutFillElement = ref }
            d={d}
            fill={fillColor}
          />
            <Svg.Path
            ref={ ref => this._loopOutBorderElement = ref }
            d={d}
            stroke={borderColor}
            fillOpacity={0}
            strokeWidth={borderWidth}
          />

          <Svg.Path
            ref={ ref => this._loopInElement = ref }
            d={d}
            stroke={borderColor}
            fill={fillColor}
            strokeWidth={borderWidth}
          />
        </Svg>
      </View>
    )
  }
}

Loop.defaultProps = {
  isLast: true,
}

const styles = StyleSheet.create({
  loop: {
    width: '100%',
    aspectRatio: 1/3,
  }
})

export default Loop
