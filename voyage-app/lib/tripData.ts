export type Trip = {
  flight: {
    origin: {
      name: string;
      lat: number;
      lng: number;
    };
    destination: {
      name: string;
      lat: number;
      lng: number;
    };
  };
  stop: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: string;
    questions: string[];
  };
};

