/**
 * Minimal dense linear algebra for stability analysis (spec §3.2). The only
 * non-trivial routine is a real-matrix eigenvalue solver: reduction to upper
 * Hessenberg form followed by the classic real QR algorithm (a TypeScript port of
 * the well-known EISPACK `elmhes`/`hqr` pair). We only need eigenvalues (to read
 * off the sign of the largest real part), not eigenvectors.
 *
 * Tested against matrices with known spectra in linalg.test.ts.
 */

export interface Complex {
  re: number
  im: number
}

export type Matrix = number[][]

/** Deep-copy a square matrix. */
function clone(a: Matrix): Matrix {
  return a.map((row) => row.slice())
}

/**
 * Reduce a real square matrix to upper Hessenberg form by stabilized elementary
 * (Gaussian) similarity transforms — EISPACK `elmhes`. Modifies a copy.
 */
function elmhes(aIn: Matrix): Matrix {
  const a = clone(aIn)
  const n = a.length
  for (let m = 1; m < n - 1; m++) {
    let x = 0
    let i = m
    // Find the pivot (largest magnitude in column m-1, rows m..n-1).
    for (let j = m; j < n; j++) {
      if (Math.abs(a[j][m - 1]) > Math.abs(x)) {
        x = a[j][m - 1]
        i = j
      }
    }
    if (i !== m) {
      // Interchange rows and columns.
      for (let j = m - 1; j < n; j++) {
        const t = a[i][j]
        a[i][j] = a[m][j]
        a[m][j] = t
      }
      for (let j = 0; j < n; j++) {
        const t = a[j][i]
        a[j][i] = a[j][m]
        a[j][m] = t
      }
    }
    if (x !== 0) {
      for (i = m + 1; i < n; i++) {
        let y = a[i][m - 1]
        if (y !== 0) {
          y /= x
          a[i][m - 1] = y
          for (let j = m; j < n; j++) a[i][j] -= y * a[m][j]
          for (let j = 0; j < n; j++) a[j][m] += y * a[j][i]
        }
      }
    }
  }
  return a
}

/**
 * Eigenvalues of a real upper Hessenberg matrix via the QR algorithm with
 * implicit double shifts — EISPACK `hqr`. Returns n complex eigenvalues.
 */
function hqr(hIn: Matrix): Complex[] {
  const h = clone(hIn)
  const n = h.length
  const wr = new Array<number>(n).fill(0)
  const wi = new Array<number>(n).fill(0)

  let anorm = 0
  for (let i = 0; i < n; i++) {
    for (let j = Math.max(i - 1, 0); j < n; j++) anorm += Math.abs(h[i][j])
  }

  let nn = n - 1
  let t = 0
  while (nn >= 0) {
    let its = 0
    let l: number
    do {
      // Look for a small sub-diagonal element to split the matrix.
      for (l = nn; l >= 1; l--) {
        let s = Math.abs(h[l - 1][l - 1]) + Math.abs(h[l][l])
        if (s === 0) s = anorm
        if (Math.abs(h[l][l - 1]) <= Number.EPSILON * s) {
          h[l][l - 1] = 0
          break
        }
      }
      let x = h[nn][nn]
      if (l === nn) {
        // One real root.
        wr[nn] = x + t
        wi[nn] = 0
        nn--
      } else {
        let y = h[nn - 1][nn - 1]
        let w = h[nn][nn - 1] * h[nn - 1][nn]
        if (l === nn - 1) {
          // Two roots (real or complex conjugate).
          const p = 0.5 * (y - x)
          const q = p * p + w
          let z = Math.sqrt(Math.abs(q))
          x += t
          if (q >= 0) {
            z = p + (p >= 0 ? Math.abs(z) : -Math.abs(z))
            wr[nn - 1] = wr[nn] = x + z
            if (z !== 0) wr[nn] = x - w / z
            wi[nn - 1] = wi[nn] = 0
          } else {
            wr[nn - 1] = wr[nn] = x + p
            wi[nn - 1] = -(wi[nn] = Math.abs(z))
          }
          nn -= 2
        } else {
          // No convergence yet: form a shift and iterate.
          if (its === 60) {
            // Give up gracefully — return what we have rather than loop forever.
            throw new Error('hqr: too many iterations')
          }
          if (its === 10 || its === 20) {
            // Exceptional shift.
            t += x
            for (let i = 0; i <= nn; i++) h[i][i] -= x
            const s = Math.abs(h[nn][nn - 1]) + Math.abs(h[nn - 1][nn - 2])
            y = x = 0.75 * s
            w = -0.4375 * s * s
          }
          its++
          let m: number
          let p = 0
          let q = 0
          let r = 0
          for (m = nn - 2; m >= l; m--) {
            const z = h[m][m]
            r = x - z
            const s2 = y - z
            p = (r * s2 - w) / h[m + 1][m] + h[m][m + 1]
            q = h[m + 1][m + 1] - z - r - s2
            r = h[m + 2][m + 1]
            const sc = Math.abs(p) + Math.abs(q) + Math.abs(r)
            p /= sc
            q /= sc
            r /= sc
            if (m === l) break
            const u = Math.abs(h[m][m - 1]) * (Math.abs(q) + Math.abs(r))
            const v = Math.abs(p) * (Math.abs(h[m - 1][m - 1]) + Math.abs(z) + Math.abs(h[m + 1][m + 1]))
            if (u <= Number.EPSILON * v) break
          }
          for (let i = m + 2; i <= nn; i++) {
            h[i][i - 2] = 0
            if (i !== m + 2) h[i][i - 3] = 0
          }
          for (let k = m; k <= nn - 1; k++) {
            if (k !== m) {
              p = h[k][k - 1]
              q = h[k + 1][k - 1]
              r = 0
              if (k !== nn - 1) r = h[k + 2][k - 1]
              x = Math.abs(p) + Math.abs(q) + Math.abs(r)
              if (x !== 0) {
                p /= x
                q /= x
                r /= x
              }
            }
            const s = p >= 0 ? Math.sqrt(p * p + q * q + r * r) : -Math.sqrt(p * p + q * q + r * r)
            if (s !== 0) {
              if (k === m) {
                if (l !== m) h[k][k - 1] = -h[k][k - 1]
              } else {
                h[k][k - 1] = -s * x
              }
              p += s
              const px = p / s
              const qx = q / s
              const rx = r / s
              q /= p
              r /= p
              for (let j = k; j <= nn; j++) {
                let pp = h[k][j] + q * h[k + 1][j]
                if (k !== nn - 1) {
                  pp += r * h[k + 2][j]
                  h[k + 2][j] -= pp * rx
                }
                h[k + 1][j] -= pp * qx
                h[k][j] -= pp * px
              }
              const mmin = nn < k + 3 ? nn : k + 3
              for (let i = l; i <= mmin; i++) {
                let pp = px * h[i][k] + qx * h[i][k + 1]
                if (k !== nn - 1) {
                  pp += rx * h[i][k + 2]
                  h[i][k + 2] -= pp * r
                }
                h[i][k + 1] -= pp * q
                h[i][k] -= pp
              }
            }
          }
        }
      }
    } while (l < nn - 1)
  }

  const out: Complex[] = []
  for (let i = 0; i < n; i++) out.push({ re: wr[i], im: wi[i] })
  return out
}

/** Eigenvalues of a general real square matrix. */
export function eigenvalues(a: Matrix): Complex[] {
  const n = a.length
  if (n === 0) return []
  if (n === 1) return [{ re: a[0][0], im: 0 }]
  return hqr(elmhes(a))
}

/** The largest real part among a set of eigenvalues. */
export function maxRealPart(eigs: Complex[]): number {
  return eigs.reduce((m, e) => Math.max(m, e.re), -Infinity)
}

/** Spectral abscissa sign-based stability: all real parts < tol ⇒ stable. */
export function isStable(eigs: Complex[], tol = 1e-9): boolean {
  return eigs.every((e) => e.re < -tol)
}

/**
 * Solve A·x = b for x by Gaussian elimination with partial pivoting. Returns null
 * if the matrix is (numerically) singular. Used by the Newton equilibrium solver.
 */
export function solveLinear(aIn: Matrix, bIn: number[]): number[] | null {
  const n = aIn.length
  const a = aIn.map((row, i) => [...row, bIn[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r
    if (Math.abs(a[piv][col]) < 1e-14) return null
    if (piv !== col) {
      const tmp = a[piv]
      a[piv] = a[col]
      a[col] = tmp
    }
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / a[col][col]
      for (let c = col; c <= n; c++) a[r][c] -= f * a[col][c]
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = a[i][n]
    for (let j = i + 1; j < n; j++) s -= a[i][j] * x[j]
    x[i] = s / a[i][i]
  }
  return x
}
