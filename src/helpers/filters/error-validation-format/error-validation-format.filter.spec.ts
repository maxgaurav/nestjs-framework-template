import { UnprocessableEntityException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ErrorValidationFormatFilter } from './error-validation-format.filter.js';

const validationError: ValidationError = {
  property: 'email',
  constraints: { isEmail: 'email must be an email' },
  children: [],
};

const hostFor = (request: object, response: object) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  }) as unknown as ArgumentsHost;

const exception = () =>
  new UnprocessableEntityException(
    [validationError],
    'The given data was invalid.',
  );

describe('ErrorValidationFormatFilter', () => {
  const filter = new ErrorValidationFormatFilter();

  const response = () => {
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
      render: vi.fn(() => res),
      redirect: vi.fn(),
    };
    return res;
  };

  it('formats nested validation errors by property path', () => {
    expect(
      filter.formattedErrors([
        validationError,
        {
          property: 'address',
          children: [
            {
              property: 'city',
              constraints: { isNotEmpty: 'city should not be empty' },
              children: [],
            },
          ],
        },
      ]),
    ).toEqual({
      email: ['email must be an email'],
      'address.city': ['city should not be empty'],
    });
  });

  it('answers JSON clients with { errors, message }', () => {
    const res = response();
    filter.catch(
      exception(),
      hostFor({ accepts: () => 'json', session: {} }, res),
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errors: { email: ['email must be an email'] },
      }),
    );
  });

  // Regression: a failed GET redirected to its own URL, which browsers follow forever
  it('renders the problems for a failed web GET instead of redirecting', () => {
    const res = response();
    filter.catch(
      exception(),
      hostFor({ accepts: () => 'html', method: 'GET', session: {} }, res),
    );

    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('errors/invalid-request', {
      errors: ['email must be an email'],
    });
  });

  it('flashes and redirects back for a failed web form POST', () => {
    const res = response();
    const flash = vi.fn();
    filter.catch(
      exception(),
      hostFor(
        {
          accepts: () => 'html',
          method: 'POST',
          body: { email: 'x' },
          flash,
          header: () => '/form',
          session: { save: (done: () => void) => done() },
        },
        res,
      ),
    );

    expect(flash).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/form');
  });

  it('answers JSON on a stateless route (no session) even for HTML clients', () => {
    const res = response();
    filter.catch(
      exception(),
      hostFor({ accepts: () => 'html', method: 'POST' }, res),
    );

    expect(res.json).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
